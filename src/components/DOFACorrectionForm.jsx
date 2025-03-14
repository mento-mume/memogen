import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { saveAs } from "file-saver";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import DatePickerField from "@/components/DatePickerField";

// Initial empty DOFA correction entry object
const initialEntry = {
  name: "",
  ippis: "",
  previousDOFA: null,
  newDOFA: null,
  documents: {
    payslip: false,
    assumption: false,
    appointment: false,
    resignation: false,
    acceptanceResignation: false,
    recordService: false,
  },
  otherDocuments: "",
  observation: "",
  remark: "approve",
};

const DOFACorrectionForm = () => {
  // Main form state
  const [formData, setFormData] = useState({
    reference: "",
    date: null,
    mda: "",
    address: "",
    recipient: "",
    requestType: {
      single: true,
      multiple: false,
    },
    entries: [{ ...initialEntry }],
  });

  // Validation and notification states
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  // Supporting documents configuration
  const supportingDocuments = [
    { id: "payslip", label: "Payslip" },
    { id: "assumption", label: "Assumption of Duty" },
    { id: "appointment", label: "Appointment Letter" },
    { id: "resignation", label: "Resignation Letter" },
    { id: "acceptanceResignation", label: "Acceptance of Resignation" },
    { id: "recordService", label: "Record of Service" },
  ];

  // Input change handlers
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleRequestTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      requestType: {
        single: type === "single",
        multiple: type === "multiple",
      },
    }));
  };

  const handleEntryChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      entries: prev.entries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const handleDocumentChange = (index, docId, checked) => {
    setFormData((prev) => ({
      ...prev,
      entries: prev.entries.map((entry, i) =>
        i === index
          ? {
              ...entry,
              documents: {
                ...entry.documents,
                [docId]: checked,
              },
            }
          : entry
      ),
    }));
  };

  // Entry management functions
  const addEntry = () => {
    setFormData((prev) => ({
      ...prev,
      entries: [...prev.entries, { ...initialEntry }],
    }));
  };

  const removeEntry = (index) => {
    if (formData.entries.length > 1) {
      setFormData((prev) => ({
        ...prev,
        entries: prev.entries.filter((_, i) => i !== index),
      }));
    }
  };

  // Form validation
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
    if (!formData.recipient) {
      newErrors.recipient = "Recipient is required";
    }

    formData.entries.forEach((entry, index) => {
      if (!entry.name) newErrors[`name-${index}`] = "Name is required";
      if (!entry.ippis)
        newErrors[`ippis-${index}`] = "IPPIS number is required";
      if (!entry.previousDOFA)
        newErrors[`previousDOFA-${index}`] = "Previous DOFA is required";
      if (!entry.newDOFA)
        newErrors[`newDOFA-${index}`] = "New DOFA is required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        const docGenerated = await generateDocument(formData);

        if (docGenerated) {
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            // Reset form to initial state
            setFormData({
              reference: "",
              date: null,
              mda: "",
              address: "",
              recipient: "",
              requestType: {
                single: true,
                multiple: false,
              },
              entries: [{ ...initialEntry }],
            });
          }, 3000);
        } else {
          setShowError(true);
          setTimeout(() => setShowError(false), 3000);
        }
      } catch (error) {
        console.error("Error in form submission:", error);
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
      }
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  // Document generation function
  const generateDocument = async (data) => {
    try {
      // Check the request type and approval status
      const isSingleRequest = !data.requestType.multiple;

      // For single requests
      let templatePath;
      let fileName;

      if (isSingleRequest) {
        // Single request - check if approved or rejected
        const isApproved = data.entries[0].remark === "approve";
        templatePath = isApproved
          ? "/DOFA_Template_single.docx"
          : "/DOFA_Template_single_rejected.docx";

        const status = isApproved ? "Approved" : "Rejected";
        fileName = `DOFA_Correction_Request_${data.entries[0].name}_${status}.docx`;
      } else {
        // Multiple requests - check if all approved, all rejected, or mixed
        const allApproved = data.entries.every(
          (entry) => entry.remark === "approve"
        );
        const allRejected = data.entries.every(
          (entry) => entry.remark === "reject"
        );

        if (allApproved) {
          templatePath = "/DOFA_Template_multiple_all_approved.docx";
          fileName =
            "DOFA_Correction_Request_Multiple_Entries_All_Approved.docx";
        } else if (allRejected) {
          templatePath = "/DOFA_Template_multiple_all_rejected.docx";
          fileName =
            "DOFA_Correction_Request_Multiple_Entries_All_Rejected.docx";
        } else {
          templatePath = "/DOFA_Template_multiple_mixed.docx";
          fileName = "DOFA_Correction_Request_Multiple_Entries_Mixed.docx";
        }
      }

      console.log("Form Data:", data);
      console.log("Attempting to fetch template:", templatePath);

      // Fetch the template with error handling
      try {
        const response = await fetch(templatePath);
        if (!response.ok) {
          console.error("Template fetch failed:", {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
          });
          throw new Error(`Failed to fetch template: ${response.statusText}`);
        }

        const templateBlob = await response.blob();
        const templateArrayBuffer = await templateBlob.arrayBuffer();

        // Create a new instance of PizZip
        const zip = new PizZip(templateArrayBuffer);

        // Create a new instance of Docxtemplater
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        // Format supporting documents for each entry
        const formattedEntries = data.entries.map((entry, index) => ({
          ...entry,
          sn: String.fromCharCode(97 + index), // Convert index to letter (a, b, c, etc.)
          previousDOFA: entry.previousDOFA
            ? format(entry.previousDOFA, "do MMMM, yyyy")
            : "",
          newDOFA: entry.newDOFA ? format(entry.newDOFA, "do MMMM, yyyy") : "",
          supportingDocs: Object.entries(entry.documents)
            .filter(([, value]) => value)
            .map(([key]) => {
              const doc = supportingDocuments.find((d) => d.id === key);
              return doc ? doc.label : key;
            })
            .join(", "),
          isApproved: entry.remark === "approve",
        }));

        // Common data for all templates
        const templateData = {
          referenceNumber: data.reference,
          requestDate: data.date ? format(data.date, "do MMMM, yyyy") : "",
          mda: data.mda || "N/A",
          address: data.address || "N/A",
          recipient:
            data.recipient === "dg"
              ? "The Director General"
              : "The Permanent Secretary",
          date: format(new Date(), "do MMMM, yyyy"),
          effectiveMonth: (() => {
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            return format(nextMonth, "MMMM yyyy");
          })(),
        };

        if (isSingleRequest) {
          // For single entry
          const entry = data.entries[0];
          const isApproved = entry.remark === "approve";

          Object.assign(templateData, {
            name: entry.name,
            ippis: entry.ippis || "N/A",
            previousDOFA: entry.previousDOFA
              ? format(entry.previousDOFA, "do MMMM, yyyy")
              : "",
            newDOFA: entry.newDOFA
              ? format(entry.newDOFA, "do MMMM, yyyy")
              : "",
            supportingDocsList: formattedEntries[0].supportingDocs,
            observation: entry.observation || "No observation",
            remark: isApproved ? "Approved" : "Rejected",
            isApproved: isApproved,
            reasonForRejection: isApproved
              ? ""
              : entry.observation || "Incomplete documentation",
          });
        } else {
          // For multiple entries
          const allApproved = data.entries.every(
            (entry) => entry.remark === "approve"
          );
          const allRejected = data.entries.every(
            (entry) => entry.remark === "reject"
          );

          if (allApproved || allRejected) {
            Object.assign(templateData, {
              entries: formattedEntries,
              allApproved: allApproved,
              summaryRows: formattedEntries.map((entry) => ({
                sn: entry.sn,
                ippis: entry.ippis || "N/A",
                name: entry.name,
                previousDOFA: entry.previousDOFA,
                newDOFA: entry.newDOFA,
              })),
            });
          } else {
            // Mixed case: separate approved and rejected entries
            const approvedEntries = formattedEntries.filter(
              (entry) => entry.isApproved
            );
            const rejectedEntries = formattedEntries.filter(
              (entry) => !entry.isApproved
            );

            Object.assign(templateData, {
              entries: formattedEntries, // All entries for reference
              approvedEntries: approvedEntries,
              rejectedEntries: rejectedEntries,
              hasApproved: approvedEntries.length > 0,
              hasRejected: rejectedEntries.length > 0,
              approvedSummary: approvedEntries.map((entry) => ({
                sn: entry.sn,
                ippis: entry.ippis || "N/A",
                name: entry.name,
                previousDOFA: entry.previousDOFA,
                newDOFA: entry.newDOFA,
              })),
              rejectedSummary: rejectedEntries.map((entry) => ({
                sn: entry.sn,
                ippis: entry.ippis || "N/A",
                name: entry.name,
                previousDOFA: entry.previousDOFA,
                newDOFA: entry.newDOFA,
              })),
            });
          }
        }

        console.log("Template data:", templateData);

        try {
          // Render the document with the data
          doc.render(templateData);

          // Generate the document
          const output = doc.getZip().generate({
            type: "blob",
            mimeType:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });

          // Save the file
          saveAs(output, fileName);
          return true;
        } catch (renderError) {
          console.error("Error rendering document:", renderError);
          if (renderError.properties && renderError.properties.errors) {
            console.error("Template errors:", renderError.properties.errors);
          }
          throw renderError;
        }
      } catch (fetchError) {
        console.error("Error fetching template:", fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error("Error in document generation:", error);
      return false;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Date of First Appointment Correction Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => handleInputChange("reference", e.target.value)}
                className={errors.reference ? "border-red-500" : ""}
              />
              {errors.reference && (
                <span className="text-red-500 text-sm">{errors.reference}</span>
              )}
            </div>
            <DatePickerField
              label="Date"
              value={formData.date}
              onChange={(date) => handleInputChange("date", date)}
              error={errors.date}
            />
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

          {/* Request Type Selection */}
          <div className="space-y-2">
            <Label>Request Type</Label>
            <div className="flex space-x-4">
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

          {/* Entry Forms */}
          {formData.entries.map((entry, index) => (
            <div
              key={index}
              className="space-y-6 p-4 border rounded-lg relative"
            >
              {formData.requestType.multiple && formData.entries.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEntry(index)}
                  className="absolute top-2 right-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`name-${index}`}>Name</Label>
                  <Input
                    id={`name-${index}`}
                    value={entry.name}
                    onChange={(e) =>
                      handleEntryChange(index, "name", e.target.value)
                    }
                    className={errors[`name-${index}`] ? "border-red-500" : ""}
                  />
                  {errors[`name-${index}`] && (
                    <span className="text-red-500 text-sm">
                      {errors[`name-${index}`]}
                    </span>
                  )}
                </div>
                <div>
                  <Label htmlFor={`ippis-${index}`}>IPPIS Number</Label>
                  <Input
                    id={`ippis-${index}`}
                    value={entry.ippis}
                    onChange={(e) =>
                      handleEntryChange(index, "ippis", e.target.value)
                    }
                    className={errors[`ippis-${index}`] ? "border-red-500" : ""}
                  />
                  {errors[`ippis-${index}`] && (
                    <span className="text-red-500 text-sm">
                      {errors[`ippis-${index}`]}
                    </span>
                  )}
                </div>
              </div>

              {/* DOFA Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePickerField
                  label="Previous DOFA"
                  value={entry.previousDOFA}
                  onChange={(date) =>
                    handleEntryChange(index, "previousDOFA", date)
                  }
                  error={errors[`previousDOFA-${index}`]}
                />
                <DatePickerField
                  label="New DOFA"
                  value={entry.newDOFA}
                  onChange={(date) => handleEntryChange(index, "newDOFA", date)}
                  error={errors[`newDOFA-${index}`]}
                />
              </div>

              {/* Supporting Documents */}
              <div className="space-y-2">
                <Label>Supporting Documents</Label>
                <div className="grid grid-cols-2 gap-4">
                  {supportingDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${doc.id}-${index}`}
                        checked={entry.documents[doc.id]}
                        onCheckedChange={(checked) =>
                          handleDocumentChange(index, doc.id, checked)
                        }
                      />
                      <Label htmlFor={`${doc.id}-${index}`}>{doc.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Fields */}
              <div>
                <Label htmlFor={`other-docs-${index}`}>
                  Other Supporting Documents
                </Label>
                <Input
                  id={`other-docs-${index}`}
                  value={entry.otherDocuments}
                  onChange={(e) =>
                    handleEntryChange(index, "otherDocuments", e.target.value)
                  }
                />
              </div>

              <div>
                <Label htmlFor={`observation-${index}`}>Observation</Label>
                <Input
                  id={`observation-${index}`}
                  value={entry.observation}
                  onChange={(e) =>
                    handleEntryChange(index, "observation", e.target.value)
                  }
                />
              </div>

              {/* Remark Selection */}
              <div className="space-y-2">
                <Label>Remark</Label>
                <Select
                  value={entry.remark}
                  onValueChange={(value) =>
                    handleEntryChange(index, "remark", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a remark" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}

          {/* Add Entry Button */}
          {formData.requestType.multiple && (
            <Button
              type="button"
              onClick={addEntry}
              className="w-full"
              variant="outline"
            >
              Add Another Entry
            </Button>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full">
            Submit Form
          </Button>

          {/* Success/Error Messages */}
          {showSuccess && (
            <Alert className="mt-4 bg-green-100">
              <AlertDescription>
                Form submitted successfully! The DOFA correction request has
                been recorded.
              </AlertDescription>
            </Alert>
          )}

          {showError && (
            <Alert className="mt-4 bg-red-100">
              <AlertDescription>
                Please fill in all required fields correctly before submitting.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default DOFACorrectionForm;
