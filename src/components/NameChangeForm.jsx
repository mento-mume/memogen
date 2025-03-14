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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import DatePickerField from "@/components/DatePickerField";

// Initial empty name entry object - now includes IPPIS number and otherSupportingDocs
const emptyNameEntry = {
  previousName: "",
  newName: "",
  ippisNumber: "",
  supportingDocs: {
    newspaper: false,
    marriageCert: false,
    courtAffidavit: false,
  },
  otherSupportingDocs: "", // Added field for other supporting documents
  observation: "",
  remarks: "",
};

const generateDocument = async (data) => {
  try {
    // Check the request type and approval status
    const isSingleRequest = !data.requestType.multiple;

    // For single requests
    let templatePath;
    let fileName;

    if (isSingleRequest) {
      // Single request - check if approved or rejected
      const isApproved = data.nameEntries[0].remarks === "approve";
      templatePath = isApproved
        ? "/CON_Template_single.docx"
        : "/CON_Template_single_rejected.docx";

      const status = isApproved ? "Approved" : "Rejected";
      fileName = `Name_Change_Request_${data.nameEntries[0].previousName}_to_${data.nameEntries[0].newName}_${status}.docx`;
    } else {
      // Multiple requests - check if all approved, all rejected, or mixed
      const allApproved = data.nameEntries.every(
        (entry) => entry.remarks === "approve"
      );
      const allRejected = data.nameEntries.every(
        (entry) => entry.remarks === "reject"
      );

      if (allApproved) {
        templatePath = "/CON_Template_multiple_all_approved.docx";
        fileName = "Name_Change_Request_Multiple_Entries_All_Approved.docx";
      } else if (allRejected) {
        templatePath = "/CON_Template_multiple_all_rejected.docx";
        fileName = "Name_Change_Request_Multiple_Entries_All_Rejected.docx";
      } else {
        templatePath = "/CON_Template_multiple_mixed.docx";
        fileName = "Name_Change_Request_Multiple_Entries_Mixed.docx";
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
      if (entry.supportingDocs.newspaper) docs.push("Newspaper publication");
      if (entry.supportingDocs.marriageCert) docs.push("Marriage Certificate");
      if (entry.supportingDocs.courtAffidavit) docs.push("Court Affidavit");

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

    // Get effective month (next month from current date)
    const getEffectiveMonth = () => {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return format(nextMonth, "MMMM yyyy");
    };

    // Common data for all templates
    const commonData = {
      referenceNumber: data.reference,
      requestDate: data.date ? format(data.date, "do MMMM, yyyy") : "",
      mda: data.mda || "N/A",
      address: data.address || "N/A",
      recipient:
        data.recipient === "dg"
          ? "The Director General"
          : "The Permanent Secretary",
      date: formatDate(new Date()),
      effectiveMonth: getEffectiveMonth(),
    };

    let templateData = {};

    if (isSingleRequest) {
      // For single entry
      const nameEntry = data.nameEntries[0];
      const isApproved = nameEntry.remarks === "approve";

      templateData = {
        ...commonData,
        previousName: nameEntry.previousName,
        newName: nameEntry.newName,
        ippisNumberFinal: nameEntry.ippisNumber || "N/A",
        supportingDocsList: getSupportingDocsList(nameEntry),
        observation: nameEntry.observation || "No observation",
        remark: isApproved ? "Approved" : "Rejected",
        isApproved: isApproved,
        reasonForRejection: isApproved
          ? ""
          : nameEntry.observation || "Incomplete documentation",
      };
    } else {
      // For multiple entries
      // Prepare all entries for reference
      const detailedEntries = data.nameEntries.map((entry, index) => ({
        sn: getLetterForIndex(index),
        ippisNumber: entry.ippisNumber || "N/A",
        previousName: entry.previousName,
        newName: entry.newName,
        supportingDocsList: getSupportingDocsList(entry),
        observation: entry.observation || "No observation",
        remark: entry.remarks === "approve" ? "Approved" : "Rejected",
        isApproved: entry.remarks === "approve",
      }));

      // Check if all approved, all rejected, or mixed
      const allApproved = data.nameEntries.every(
        (entry) => entry.remarks === "approve"
      );
      const allRejected = data.nameEntries.every(
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
            oldName: entry.previousName,
            newName: entry.newName,
          })),
        };
      } else {
        // Mixed case: separate approved and rejected entries
        const approvedEntries = data.nameEntries
          .filter((entry) => entry.remarks === "approve")
          .map((entry, index) => ({
            sn: getLetterForIndex(index),
            ippisNumber: entry.ippisNumber || "N/A",
            previousName: entry.previousName,
            newName: entry.newName,
            supportingDocsList: getSupportingDocsList(entry),
            observation: entry.observation || "No observation",
            remark: "Approved",
          }));

        const rejectedEntries = data.nameEntries
          .filter((entry) => entry.remarks === "reject")
          .map((entry, index) => ({
            sn: getLetterForIndex(index),
            ippisNumber: entry.ippisNumber || "N/A",
            previousName: entry.previousName,
            newName: entry.newName,
            supportingDocsList: getSupportingDocsList(entry),
            observation: entry.observation || "No observation",
            remark: "Rejected",
          }));

        templateData = {
          ...commonData,
          entries: detailedEntries, // All entries for reference
          approvedEntries: approvedEntries, // Only approved entries
          rejectedEntries: rejectedEntries, // Only rejected entries
          hasApproved: approvedEntries.length > 0,
          hasRejected: rejectedEntries.length > 0,

          // Summary tables for approved and rejected
          approvedSummary: approvedEntries.map((entry) => ({
            sn: entry.sn,
            ippisNumber: entry.ippisNumber,
            oldName: entry.previousName,
            newName: entry.newName,
          })),
          rejectedSummary: rejectedEntries.map((entry) => ({
            sn: entry.sn,
            ippisNumber: entry.ippisNumber,
            oldName: entry.previousName,
            newName: entry.newName,
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

// Helper function to convert index to letter (0 -> a, 1 -> b, etc.)
function getLetterForIndex(index) {
  return String.fromCharCode(97 + index); // 97 is ASCII for 'a'
}

const NameChangeForm = () => {
  // State to manage form data
  const [formData, setFormData] = useState({
    reference: "",
    date: null,
    mda: "",
    address: "",
    recipient: "", // Add new recipient field
    requestType: {
      single: false,
      multiple: false,
    },
    nameEntries: [{ ...emptyNameEntry }],
  });
  console.log(formData);

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

  // Handle input change for name entries
  const handleNameEntryChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      nameEntries: prev.nameEntries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  // Handle change for supporting documents checkboxes
  const handleSupportingDocsChange = (index, docType) => {
    setFormData((prev) => ({
      ...prev,
      nameEntries: prev.nameEntries.map((entry, i) =>
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
      nameEntries:
        type === "single" ? [{ ...emptyNameEntry }] : prev.nameEntries,
    }));
  };

  // Add a new name entry
  const addNameEntry = () => {
    setFormData((prev) => ({
      ...prev,
      nameEntries: [...prev.nameEntries, { ...emptyNameEntry }],
    }));
  };

  // Remove a name entry
  const removeNameEntry = (index) => {
    if (formData.nameEntries.length > 1) {
      setFormData((prev) => ({
        ...prev,
        nameEntries: prev.nameEntries.filter((_, i) => i !== index),
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
    if (!formData.mda) {
      newErrors.mda = "MDA is required";
    }
    if (!formData.address) {
      newErrors.address = "Address is required";
    }
    if (!formData.requestType.single && !formData.requestType.multiple) {
      newErrors.requestType = "Please select a request type";
    }
    if (!formData.recipient) {
      newErrors.recipient = "Recipient is required";
    }

    formData.nameEntries.forEach((entry, index) => {
      if (!entry.previousName) {
        newErrors[`previousName_${index}`] = "Previous name is required";
      }
      if (!entry.newName) {
        newErrors[`newName_${index}`] = "New name is required";
      }
      if (!entry.ippisNumber) {
        newErrors[`ippisNumber_${index}`] = "IPPIS number is required";
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
              mda: "",
              address: "",
              recipient: "", // Reset recipient
              requestType: { single: false, multiple: false },
              nameEntries: [{ ...emptyNameEntry }],
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
          <CardTitle>Change of Name Request Form</CardTitle>
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

          <DatePickerField
            label="Date"
            value={formData.date}
            onChange={(date) => handleInputChange("date", date)}
            error={errors.date}
          />

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

          {/* Updated Address Field */}
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

          {formData.nameEntries.map((entry, index) => (
            <div key={index} className="space-y-6 p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  Name Change Entry #{index + 1}
                </h3>
                {formData.requestType.multiple &&
                  formData.nameEntries.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNameEntry(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`previousName_${index}`}
                  className="flex justify-between"
                >
                  Previous Name
                  {errors[`previousName_${index}`] && (
                    <span className="text-red-500 text-sm">
                      {errors[`previousName_${index}`]}
                    </span>
                  )}
                </Label>
                <Input
                  id={`previousName_${index}`}
                  value={entry.previousName}
                  onChange={(e) =>
                    handleNameEntryChange(index, "previousName", e.target.value)
                  }
                  className={
                    errors[`previousName_${index}`] ? "border-red-500" : ""
                  }
                  placeholder="Enter previous name"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`newName_${index}`}
                  className="flex justify-between"
                >
                  New Name
                  {errors[`newName_${index}`] && (
                    <span className="text-red-500 text-sm">
                      {errors[`newName_${index}`]}
                    </span>
                  )}
                </Label>
                <Input
                  id={`newName_${index}`}
                  value={entry.newName}
                  onChange={(e) =>
                    handleNameEntryChange(index, "newName", e.target.value)
                  }
                  className={errors[`newName_${index}`] ? "border-red-500" : ""}
                  placeholder="Enter new name"
                />
              </div>

              {/* IPPIS Number Field */}
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
                    handleNameEntryChange(index, "ippisNumber", e.target.value)
                  }
                  className={
                    errors[`ippisNumber_${index}`] ? "border-red-500" : ""
                  }
                  placeholder="Enter IPPIS Number"
                />
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
                      id={`newspaper_${index}`}
                      checked={entry.supportingDocs.newspaper}
                      onCheckedChange={() =>
                        handleSupportingDocsChange(index, "newspaper")
                      }
                    />
                    <Label htmlFor={`newspaper_${index}`}>Newspaper</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`marriageCert_${index}`}
                      checked={entry.supportingDocs.marriageCert}
                      onCheckedChange={() =>
                        handleSupportingDocsChange(index, "marriageCert")
                      }
                    />
                    <Label htmlFor={`marriageCert_${index}`}>
                      Marriage Certificate
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`courtAffidavit_${index}`}
                      checked={entry.supportingDocs.courtAffidavit}
                      onCheckedChange={() =>
                        handleSupportingDocsChange(index, "courtAffidavit")
                      }
                    />
                    <Label htmlFor={`courtAffidavit_${index}`}>
                      Court Affidavit
                    </Label>
                  </div>
                </div>
              </div>

              {/* Other Supporting Documents Field */}
              <div className="space-y-2">
                <Label htmlFor={`otherSupportingDocs_${index}`}>
                  Other Supporting Documents
                </Label>
                <Input
                  id={`otherSupportingDocs_${index}`}
                  value={entry.otherSupportingDocs}
                  onChange={(e) =>
                    handleNameEntryChange(
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
                    handleNameEntryChange(index, "observation", e.target.value)
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
                    handleNameEntryChange(index, "remarks", value)
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
              onClick={addNameEntry}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Name Change
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
                mda: "",
                address: "",
                recipient: "", // Reset recipient
                requestType: { single: false, multiple: false },
                nameEntries: [{ ...emptyNameEntry }],
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

export default NameChangeForm;
