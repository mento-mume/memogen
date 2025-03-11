import { useState } from "react";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import { format } from "date-fns";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// Initial empty DOB correction entry object
const emptyDOBEntry = {
  name: "",
  ippisNumber: "",
  previousDOB: null,
  newDOB: null,
  supportingDocs: {
    dob: false,
    payslip: false,
    primary: false,
    service: false,
  },
  otherSupportingDocs: "",
  observation: "",
  remarks: "",
};

// Document generation function
const generateDocument = async (data) => {
  try {
    // Determine which template to use based on the request type
    const isSingleRequest = !data.requestType.multiple;

    let templatePath;
    let fileName;

    if (isSingleRequest) {
      // Single request - check if approved or rejected
      const isApproved = data.dobEntries[0].remarks === "approve";
      templatePath = isApproved
        ? "/DOB_Template_single.docx"
        : "/DOB_Template_single_rejected.docx";

      const status = isApproved ? "Approved" : "Rejected";
      fileName = `DOB_Correction_Request_${data.dobEntries[0].name}_${status}.docx`;
    } else {
      // Multiple requests - check if all approved, all rejected, or mixed
      const allApproved = data.dobEntries.every(
        (entry) => entry.remarks === "approve"
      );
      const allRejected = data.dobEntries.every(
        (entry) => entry.remarks === "reject"
      );

      if (allApproved) {
        templatePath = "/DOB_Template_multiple_all_approved.docx";
        fileName = "DOB_Correction_Request_Multiple_Entries_All_Approved.docx";
      } else if (allRejected) {
        templatePath = "/DOB_Template_multiple_all_rejected.docx";
        fileName = "DOB_Correction_Request_Multiple_Entries_All_Rejected.docx";
      } else {
        templatePath = "/DOB_Template_multiple_mixed.docx";
        fileName = "DOB_Correction_Request_Multiple_Entries_Mixed.docx";
      }
    }

    // Fetch the appropriate template
    const response = await fetch(templatePath);
    const arrayBuffer = await response.arrayBuffer();
    const zip = new PizZip(arrayBuffer);

    // Create a new instance of Docxtemplater
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Format the supporting documents as a comma-separated string
    const getSupportingDocsList = (entry) => {
      const docs = [];
      if (entry.supportingDocs.dob) docs.push("Birth Certificate");
      if (entry.supportingDocs.payslip) docs.push("Payslip");
      if (entry.supportingDocs.primary) docs.push("Primary School Certificate");
      if (entry.supportingDocs.service) docs.push("Record of Service");

      // Add other supporting documents if provided
      if (entry.otherSupportingDocs.trim()) {
        docs.push(entry.otherSupportingDocs);
      }

      return docs.join(", ");
    };

    // Format current date
    const formatDate = (date) => {
      return format(date || new Date(), "do MMMM, yyyy");
    };

    // Common data for both single and multiple templates
    const commonData = {
      referenceNumber: data.reference,
      requestDate: data.date ? format(data.date, "do MMMM, yyyy") : "",
      date: formatDate(new Date()),
    };

    let templateData = {};

    if (isSingleRequest) {
      // For single entry
      const dobEntry = data.dobEntries[0];
      const isApproved = dobEntry.remarks === "approve";

      templateData = {
        ...commonData,
        name: dobEntry.name,
        ippisNumber: dobEntry.ippisNumber || "N/A",
        previousDOB: dobEntry.previousDOB
          ? format(dobEntry.previousDOB, "do MMMM, yyyy")
          : "",
        newDOB: dobEntry.newDOB ? format(dobEntry.newDOB, "do MMMM, yyyy") : "",
        supportingDocsList: getSupportingDocsList(dobEntry),
        observation: dobEntry.observation || "No observation",
        remark: isApproved ? "Approved" : "Rejected",
        isApproved: isApproved,
        reasonForRejection: isApproved
          ? ""
          : dobEntry.observation || "Incomplete documentation",
      };
    } else {
      // For multiple entries
      const detailedEntries = data.dobEntries.map((entry, index) => ({
        sn: String.fromCharCode(97 + index), // a, b, c, etc.
        name: entry.name,
        ippisNumber: entry.ippisNumber || "N/A",
        previousDOB: entry.previousDOB
          ? format(entry.previousDOB, "do MMMM, yyyy")
          : "",
        newDOB: entry.newDOB ? format(entry.newDOB, "do MMMM, yyyy") : "",
        supportingDocsList: getSupportingDocsList(entry),
        observation: entry.observation || "No observation",
        remark: entry.remarks === "approve" ? "Approved" : "Rejected",
        isApproved: entry.remarks === "approve",
      }));

      // Check if all approved, all rejected, or mixed
      const allApproved = data.dobEntries.every(
        (entry) => entry.remarks === "approve"
      );
      const allRejected = data.dobEntries.every(
        (entry) => entry.remarks === "reject"
      );

      if (allApproved || allRejected) {
        // Simple case: all entries have the same status
        templateData = {
          ...commonData,
          entries: detailedEntries,
          allApproved: allApproved,
          summaryRows: detailedEntries.map((entry) => ({
            sn: entry.sn,
            ippisNumber: entry.ippisNumber,
            name: entry.name,
            previousDOB: entry.previousDOB,
            newDOB: entry.newDOB,
          })),
        };
      } else {
        // Mixed case: separate approved and rejected entries
        const approvedEntries = data.dobEntries
          .filter((entry) => entry.remarks === "approve")
          .map((entry, index) => ({
            sn: String.fromCharCode(97 + index),
            name: entry.name,
            ippisNumber: entry.ippisNumber || "N/A",
            previousDOB: entry.previousDOB
              ? format(entry.previousDOB, "do MMMM, yyyy")
              : "",
            newDOB: entry.newDOB ? format(entry.newDOB, "do MMMM, yyyy") : "",
            supportingDocsList: getSupportingDocsList(entry),
            observation: entry.observation || "No observation",
            remark: "Approved",
          }));

        const rejectedEntries = data.dobEntries
          .filter((entry) => entry.remarks === "reject")
          .map((entry, index) => ({
            sn: String.fromCharCode(97 + index),
            name: entry.name,
            ippisNumber: entry.ippisNumber || "N/A",
            previousDOB: entry.previousDOB
              ? format(entry.previousDOB, "do MMMM, yyyy")
              : "",
            newDOB: entry.newDOB ? format(entry.newDOB, "do MMMM, yyyy") : "",
            supportingDocsList: getSupportingDocsList(entry),
            observation: entry.observation || "No observation",
            remark: "Rejected",
          }));

        templateData = {
          ...commonData,
          entries: detailedEntries,
          approvedEntries: approvedEntries,
          rejectedEntries: rejectedEntries,
          hasApproved: approvedEntries.length > 0,
          hasRejected: rejectedEntries.length > 0,

          // Summary tables for approved and rejected
          approvedSummary: approvedEntries.map((entry) => ({
            sn: entry.sn,
            ippisNumber: entry.ippisNumber,
            name: entry.name,
            previousDOB: entry.previousDOB,
            newDOB: entry.newDOB,
          })),
          rejectedSummary: rejectedEntries.map((entry) => ({
            sn: entry.sn,
            ippisNumber: entry.ippisNumber,
            name: entry.name,
            previousDOB: entry.previousDOB,
            newDOB: entry.newDOB,
          })),
        };
      }
    }

    console.log("Template data:", templateData);
    console.log("Using template:", templatePath);

    // Set the template data
    doc.setData(templateData);

    // Render the document
    doc.render();

    // Get the binary content of the output document
    const output = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // Save the document
    saveAs(output, fileName);

    return true;
  } catch (error) {
    console.error("Error generating document:", error);
    return false;
  }
};

const DOBCorrectionForm = () => {
  // State to manage form data
  const [formData, setFormData] = useState({
    reference: "",
    date: null,
    requestType: {
      single: true,
      multiple: false,
    },
    dobEntries: [{ ...emptyDOBEntry }],
  });

  // State to manage form errors
  const [errors, setErrors] = useState({});
  // State to manage form submission status
  const [submitStatus, setSubmitStatus] = useState(null);

  // Handle input change for form fields
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  // Handle input change for DOB entries
  const handleDOBEntryChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      dobEntries: prev.dobEntries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  // Handle change for supporting documents checkboxes
  const handleSupportingDocsChange = (index, docType) => {
    setFormData((prev) => ({
      ...prev,
      dobEntries: prev.dobEntries.map((entry, i) =>
        i === index
          ? {
              ...entry,
              supportingDocs: {
                ...entry.supportingDocs,
                [docType]: !entry.supportingDocs[docType],
              },
            }
          : entry
      ),
    }));
  };

  // Handle change for request type (single/multiple)
  const handleRequestTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      requestType: {
        single: type === "single",
        multiple: type === "multiple",
      },
      dobEntries: type === "single" ? [{ ...emptyDOBEntry }] : prev.dobEntries,
    }));
  };

  // Add a new DOB entry
  const addDOBEntry = () => {
    setFormData((prev) => ({
      ...prev,
      dobEntries: [...prev.dobEntries, { ...emptyDOBEntry }],
    }));
  };

  // Remove a DOB entry
  const removeDOBEntry = (index) => {
    if (formData.dobEntries.length > 1) {
      setFormData((prev) => ({
        ...prev,
        dobEntries: prev.dobEntries.filter((_, i) => i !== index),
      }));
    }
  };

  // Validate the form before submission
  const validateForm = () => {
    const newErrors = {};

    if (!formData.reference) {
      newErrors.reference = "Reference number is required";
    }
    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    formData.dobEntries.forEach((entry, index) => {
      if (!entry.name) {
        newErrors[`name_${index}`] = "Name is required";
      }
      if (!entry.ippisNumber) {
        newErrors[`ippisNumber_${index}`] = "IPPIS number is required";
      }
      if (!entry.previousDOB) {
        newErrors[`previousDOB_${index}`] = "Previous DOB is required";
      }
      if (!entry.newDOB) {
        newErrors[`newDOB_${index}`] = "New DOB is required";
      }

      // Check if at least one supporting document is selected or other supporting docs is provided
      if (
        !Object.values(entry.supportingDocs).some(Boolean) &&
        !entry.otherSupportingDocs.trim()
      ) {
        newErrors[`supportingDocs_${index}`] =
          "At least one supporting document is required";
      }
      if (!entry.remarks) {
        newErrors[`remarks_${index}`] = "Please select remarks";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // (Previous code continues...)

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitStatus(null);

    if (validateForm()) {
      setTimeout(async () => {
        // Generate the document
        const docGenerated = await generateDocument(formData);

        setSubmitStatus(docGenerated ? "success" : "error");

        if (docGenerated) {
          setTimeout(() => {
            setFormData({
              reference: "",
              date: null,
              requestType: { single: true, multiple: false },
              dobEntries: [{ ...emptyDOBEntry }],
            });
            setSubmitStatus(null);
          }, 3000);
        }
      }, 1000);
    } else {
      setSubmitStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Date of Birth Correction Request Form</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {submitStatus === "success" && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Form submitted successfully!</AlertDescription>
            </Alert>
          )}
          {submitStatus === "error" && (
            <Alert className="bg-red-50 text-red-800 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please correct the errors in the form.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reference" className="flex justify-between">
              Reference Number
              {errors.reference && (
                <span className="text-red-500 text-sm">{errors.reference}</span>
              )}
            </Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => handleInputChange("reference", e.target.value)}
              className={errors.reference ? "border-red-500" : ""}
              placeholder="Enter reference number"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex justify-between">
              Date
              {errors.date && (
                <span className="text-red-500 text-sm">{errors.date}</span>
              )}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    errors.date ? "border-red-500" : ""
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => handleInputChange("date", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* MDA Field */}
          <div className="space-y-2">
            <Label htmlFor="mda" className="flex justify-between">
              MDA (Ministry, Department or Agency)
              {errors.mda && (
                <span className="text-red-500 text-sm">{errors.mda}</span>
              )}
            </Label>
            <Input
              id="mda"
              value={formData.mda}
              onChange={(e) => handleInputChange("mda", e.target.value)}
              className={errors.mda ? "border-red-500" : ""}
              placeholder="Enter MDA"
            />
          </div>

          {/* Address Field */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex justify-between">
              Address on Letter
              {errors.address && (
                <span className="text-red-500 text-sm">{errors.address}</span>
              )}
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className={errors.address ? "border-red-500" : ""}
              placeholder="Enter address for the letter"
              rows={3}
            />
          </div>

          {/* Recipient Select Field */}
          <div className="space-y-2">
            <Label htmlFor="recipient" className="flex justify-between">
              Letter Recipient
              {errors.recipient && (
                <span className="text-red-500 text-sm">{errors.recipient}</span>
              )}
            </Label>
            <Select
              value={formData.recipient}
              onValueChange={(value) => handleInputChange("recipient", value)}
            >
              <SelectTrigger
                className={errors.recipient ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dg">The Director General</SelectItem>
                <SelectItem value="ps">The Permanent Secretary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex justify-between">
              Request Type
              {errors.requestType && (
                <span className="text-red-500 text-sm">
                  {errors.requestType}
                </span>
              )}
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="single"
                  checked={formData.requestType.single}
                  onCheckedChange={() => handleRequestTypeChange("single")}
                />
                <Label htmlFor="single">Single</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="multiple"
                  checked={formData.requestType.multiple}
                  onCheckedChange={() => handleRequestTypeChange("multiple")}
                />
                <Label htmlFor="multiple">Multiple</Label>
              </div>
            </div>
          </div>

          {formData.dobEntries.map((entry, index) => (
            <div key={index} className="space-y-6 p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  DOB Correction Entry #{index + 1}
                </h3>
                {formData.requestType.multiple &&
                  formData.dobEntries.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDOBEntry(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`name_${index}`}
                  className="flex justify-between"
                >
                  Name
                  {errors[`name_${index}`] && (
                    <span className="text-red-500 text-sm">
                      {errors[`name_${index}`]}
                    </span>
                  )}
                </Label>
                <Input
                  id={`name_${index}`}
                  value={entry.name}
                  onChange={(e) =>
                    handleDOBEntryChange(index, "name", e.target.value)
                  }
                  className={errors[`name_${index}`] ? "border-red-500" : ""}
                  placeholder="Enter name"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`ippisNumber_${index}`}
                  className="flex justify-between"
                >
                  IPPIS Number
                  {errors[`ippisNumber_${index}`] && (
                    <span className="text-red-500 text-sm">
                      {errors[`ippisNumber_${index}`]}
                    </span>
                  )}
                </Label>
                <Input
                  id={`ippisNumber_${index}`}
                  value={entry.ippisNumber}
                  onChange={(e) =>
                    handleDOBEntryChange(index, "ippisNumber", e.target.value)
                  }
                  className={
                    errors[`ippisNumber_${index}`] ? "border-red-500" : ""
                  }
                  placeholder="Enter IPPIS Number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex justify-between">
                    Previous DOB
                    {errors[`previousDOB_${index}`] && (
                      <span className="text-red-500 text-sm">
                        {errors[`previousDOB_${index}`]}
                      </span>
                    )}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          errors[`previousDOB_${index}`] ? "border-red-500" : ""
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {entry.previousDOB
                          ? format(entry.previousDOB, "PPP")
                          : "Select previous DOB"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={entry.previousDOB}
                        onSelect={(date) =>
                          handleDOBEntryChange(index, "previousDOB", date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="flex justify-between">
                    New DOB
                    {errors[`newDOB_${index}`] && (
                      <span className="text-red-500 text-sm">
                        {errors[`newDOB_${index}`]}
                      </span>
                    )}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          errors[`newDOB_${index}`] ? "border-red-500" : ""
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {entry.newDOB
                          ? format(entry.newDOB, "PPP")
                          : "Select new DOB"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={entry.newDOB}
                        onSelect={(date) =>
                          handleDOBEntryChange(index, "newDOB", date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex justify-between">
                  Supporting Documents
                  {errors[`supportingDocs_${index}`] && (
                    <span className="text-red-500 text-sm">
                      {errors[`supportingDocs_${index}`]}
                    </span>
                  )}
                </Label>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`dob_${index}`}
                      checked={entry.supportingDocs.dob}
                      onCheckedChange={() =>
                        handleSupportingDocsChange(index, "dob")
                      }
                    />
                    <Label htmlFor={`dob_${index}`}>Birth Certificate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`payslip_${index}`}
                      checked={entry.supportingDocs.payslip}
                      onCheckedChange={() =>
                        handleSupportingDocsChange(index, "payslip")
                      }
                    />
                    <Label htmlFor={`payslip_${index}`}>Payslip</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`primary_${index}`}
                      checked={entry.supportingDocs.primary}
                      onCheckedChange={() =>
                        handleSupportingDocsChange(index, "primary")
                      }
                    />
                    <Label htmlFor={`primary_${index}`}>
                      Primary School Certificate
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`service_${index}`}
                      checked={entry.supportingDocs.service}
                      onCheckedChange={() =>
                        handleSupportingDocsChange(index, "service")
                      }
                    />
                    <Label htmlFor={`service_${index}`}>
                      Record of Service
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`otherSupportingDocs_${index}`}>
                  Other Supporting Documents
                </Label>
                <Input
                  id={`otherSupportingDocs_${index}`}
                  value={entry.otherSupportingDocs}
                  onChange={(e) =>
                    handleDOBEntryChange(
                      index,
                      "otherSupportingDocs",
                      e.target.value
                    )
                  }
                  placeholder="Enter any other supporting documents"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`observation_${index}`}>Observation</Label>
                <Input
                  id={`observation_${index}`}
                  value={entry.observation}
                  onChange={(e) =>
                    handleDOBEntryChange(index, "observation", e.target.value)
                  }
                  placeholder="Enter observation"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex justify-between">
                  Remarks
                  {errors[`remarks_${index}`] && (
                    <span className="text-red-500 text-sm">
                      {errors[`remarks_${index}`]}
                    </span>
                  )}
                </Label>
                <Select
                  value={entry.remarks}
                  onValueChange={(value) =>
                    handleDOBEntryChange(index, "remarks", value)
                  }
                >
                  <SelectTrigger
                    className={
                      errors[`remarks_${index}`] ? "border-red-500" : ""
                    }
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}

          {formData.requestType.multiple && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={addDOBEntry}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another DOB Correction
            </Button>
          )}
        </CardContent>

        <CardFooter className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                reference: "",
                date: null,
                requestType: { single: true, multiple: false },
                dobEntries: [{ ...emptyDOBEntry }],
              });
              setErrors({});
              setSubmitStatus(null);
            }}
          >
            Cancel
          </Button>
          <Button type="submit">Submit</Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default DOBCorrectionForm;
