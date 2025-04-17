import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { saveAs } from "file-saver";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import SharedForm from "./SharedForm";

// Initial state for a single entry
const initialEntry = {
  name: "",
  ippis: "",
  previousMDA: "",
  newMDA: "",
  documents: {
    posting: false,
    payslip: false,
    assumption: false,
    idcard: false,
  },
  otherDocuments: "",
  observation: "",
  remark: "approve",
};

// List of document types that can be selected
const supportingDocuments = [
  { id: "posting", label: "Posting Instruction" },
  { id: "payslip", label: "Payslip" },
  { id: "assumption", label: "Assumption of Duty" },
  { id: "idcard", label: "ID Card" },
];

const RestorationMigrationForm = () => {
  // Main form state
  const [formData, setFormData] = useState({
    requestType: { single: true, multiple: false },
    entries: [{ ...initialEntry }],
  });

  // Form validation errors
  const [errors, setErrors] = useState({});

  // Form submission status (success, error, or null)
  const [submitStatus, setSubmitStatus] = useState(null);

  // Switch between single and multiple request types
  const handleRequestTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      requestType: {
        single: type === "single",
        multiple: type === "multiple",
      },
    }));
  };

  // Update a field in a specific entry
  const handleEntryChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      entries: prev.entries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  // Toggle a document checkbox in a specific entry
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

  // Add a new entry to the form
  const addEntry = () => {
    setFormData({
      ...formData,
      entries: [...formData.entries, { ...initialEntry }],
    });
  };

  // Remove an entry from the form
  const removeEntry = (index) => {
    if (formData.entries.length > 1) {
      const newEntries = formData.entries.filter((_, i) => i !== index);
      setFormData({ ...formData, entries: newEntries });
    }
  };

  // Validate the form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.requestType.single && !formData.requestType.multiple) {
      newErrors.requestType = "Please select a request type";
    }

    formData.entries.forEach((entry, index) => {
      if (!entry.name) newErrors[`name-${index}`] = "Name is required";
      if (!entry.ippis)
        newErrors[`ippis-${index}`] = "IPPIS number is required";
      if (!entry.previousMDA)
        newErrors[`previousMDA-${index}`] = "Previous MDA is required";
      if (!entry.newMDA) newErrors[`newMDA-${index}`] = "New MDA is required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (commonData) => {
    if (!validateForm()) {
      setSubmitStatus("error");
      return;
    }

    try {
      const docGenerated = await generateDocument({
        ...commonData,
        ...formData,
      });

      setSubmitStatus(docGenerated ? "success" : "error");

      if (docGenerated) {
        // Reset form after successful submission (with delay)
        setTimeout(() => {
          setFormData({
            requestType: { single: true, multiple: false },
            entries: [{ ...initialEntry }],
          });
          setSubmitStatus(null);
        }, 3000);
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      setSubmitStatus("error");
    }
  };

  // Reset the form
  const handleReset = () => {
    setFormData({
      requestType: { single: true, multiple: false },
      entries: [{ ...initialEntry }],
    });
    setSubmitStatus(null);
  };

  // Generate a document based on form data
  const generateDocument = async (data) => {
    try {
      const isSingleRequest = !data.requestType.multiple;
      let templatePath, fileName;

      // Determine which template to use based on request type and approval status
      if (isSingleRequest) {
        const isApproved = data.entries[0].remark === "approve";
        templatePath = isApproved
          ? "/RES_Template_single.docx"
          : "/RES_Template_single_rejected.docx";

        const status = isApproved ? "Approved" : "Rejected";
        fileName = `Restoration_Migration_Request_${data.entries[0].name}_${status}.docx`;
      } else {
        const allApproved = data.entries.every(
          (entry) => entry.remark === "approve"
        );
        const allRejected = data.entries.every(
          (entry) => entry.remark === "reject"
        );

        if (allApproved) {
          templatePath = "/RES_Template_multiple_all_approved.docx";
          fileName =
            "Restoration_Migration_Request_Multiple_Entries_All_Approved.docx";
        } else if (allRejected) {
          templatePath = "/RES_Template_multiple_all_rejected.docx";
          fileName =
            "Restoration_Migration_Request_Multiple_Entries_All_Rejected.docx";
        } else {
          templatePath = "/RES_Template_multiple_mixed.docx";
          fileName =
            "Restoration_Migration_Request_Multiple_Entries_Mixed.docx";
        }
      }

      // Fetch the template
      const response = await fetch(templatePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.statusText}`);
      }

      const templateBlob = await response.blob();
      const templateArrayBuffer = await templateBlob.arrayBuffer();

      // Create docx template processor
      const zip = new PizZip(templateArrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Format entry data for the template
      const formattedEntries = data.entries.map((entry, index) => {
        const isApproved = entry.remark === "approve";
        return {
          ...entry,
          sn: String.fromCharCode(97 + index), // Convert index to letter (a, b, c, etc.)
          previousMDA: entry.previousMDA,
          newMDA: entry.newMDA,
          supportingDocs: Object.entries(entry.documents)
            .filter(([, value]) => value)
            .map(([key]) => {
              const doc = supportingDocuments.find((d) => d.id === key);
              return doc ? doc.label : key;
            })
            .join(", "),
          isApproved: isApproved,
          remark: isApproved
            ? "Recommended for Approval"
            : "Not Recommended for Approval",
          reasonForRejection: isApproved
            ? ""
            : entry.observation || "Incomplete documentation",
        };
      });

      // Prepare common data for template
      const templateData = {
        referenceNumber: data.reference || "N/A",
        requestDate: data.date ? format(data.date, "do MMMM, yyyy") : "",
        mda: data.mda || "N/A",
        address: data.address || "N/A",
        recipient: data.recipient || "N/A",
        date: format(new Date(), "do MMMM, yyyy"),
        effectiveMonth: format(
          new Date(new Date().setMonth(new Date().getMonth() + 1)),
          "MMMM yyyy"
        ),
      };

      // Add type-specific data to template
      if (isSingleRequest) {
        // Single entry request
        const entry = formattedEntries[0];

        Object.assign(templateData, {
          name: entry.name,
          ippis: entry.ippis || "N/A",
          previousMDA: entry.previousMDA,
          newMDA: entry.newMDA,
          supportingDocsList: entry.supportingDocs,
          observation: entry.observation || "No observation",
          remark: entry.remark,
          isApproved: entry.isApproved,
          reasonForRejection: entry.reasonForRejection,
        });
      } else {
        // Multiple entries request
        const allApproved = formattedEntries.every((entry) => entry.isApproved);
        const allRejected = formattedEntries.every(
          (entry) => !entry.isApproved
        );

        if (allApproved || allRejected) {
          Object.assign(templateData, {
            entries: formattedEntries,
            allApproved: allApproved,
            summaryRows: formattedEntries.map((entry) => ({
              sn: entry.sn,
              ippis: entry.ippis || "N/A",
              name: entry.name,
              previousMDA: entry.previousMDA,
              newMDA: entry.newMDA,
              remark: entry.remark, // This should include "Recommended for Approval" or "Not Recommended for Approval"
            })),
          });
        } else {
          // Mixed approvals and rejections
          const approvedEntries = formattedEntries.filter(
            (entry) => entry.isApproved
          );
          const rejectedEntries = formattedEntries.filter(
            (entry) => !entry.isApproved
          );

          // Debugging log to verify entries are correctly categorized
          console.log("Approved entries:", approvedEntries);
          console.log("Rejected entries:", rejectedEntries);

          Object.assign(templateData, {
            entries: formattedEntries,
            approvedEntries: approvedEntries,
            rejectedEntries: rejectedEntries,
            hasApproved: approvedEntries.length > 0,
            hasRejected: rejectedEntries.length > 0,
            approvedSummary: approvedEntries.map((entry) => ({
              sn: entry.sn,
              ippis: entry.ippis || "N/A",
              name: entry.name,
              previousMDA: entry.previousMDA,
              newMDA: entry.newMDA,
              remark: entry.remark,
            })),
            rejectedSummary: rejectedEntries.map((entry) => ({
              sn: entry.sn,
              ippis: entry.ippis || "N/A",
              name: entry.name,
              previousMDA: entry.previousMDA,
              newMDA: entry.newMDA,
              remark: entry.remark,
            })),
          });
        }

        if (allApproved || allRejected) {
          Object.assign(templateData, {
            entries: formattedEntries,
            allApproved: allApproved,
            summaryRows: formattedEntries.map((entry) => ({
              sn: entry.sn,
              ippis: entry.ippis || "N/A",
              name: entry.name,
              previousMDA: entry.previousMDA,
              newMDA: entry.newMDA,
              remark: entry.remark,
            })),
          });
        } else {
          // Mixed approvals and rejections
          const approvedEntries = formattedEntries.filter(
            (entry) => entry.isApproved
          );
          const rejectedEntries = formattedEntries.filter(
            (entry) => !entry.isApproved
          );

          Object.assign(templateData, {
            entries: formattedEntries,
            approvedEntries: approvedEntries,
            rejectedEntries: rejectedEntries,
            hasApproved: approvedEntries.length > 0,
            hasRejected: rejectedEntries.length > 0,
            approvedSummary: approvedEntries.map((entry) => ({
              sn: entry.sn,
              ippis: entry.ippis || "N/A",
              name: entry.name,
              previousMDA: entry.previousMDA,
              newMDA: entry.newMDA,
              remark: entry.remark,
            })),
            rejectedSummary: rejectedEntries.map((entry) => ({
              sn: entry.sn,
              ippis: entry.ippis || "N/A",
              name: entry.name,
              previousMDA: entry.previousMDA,
              newMDA: entry.newMDA,
              remark: entry.remark,
            })),
          });
        }
      }

      // Generate the document
      doc.render(templateData);
      const output = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      // Save the file for download
      saveAs(output, fileName);
      return true;
    } catch (error) {
      console.error("Error in document generation:", error);
      return false;
    }
  };

  return (
    <SharedForm
      title="Restoration and Migration Form"
      onSubmit={handleSubmit}
      onReset={handleReset}
      submitStatus={submitStatus}
      showSuccessMessage="Restoration and migration request submitted successfully!"
      showErrorMessage="Please correct the errors in the form."
    >
      {/* Request Type Selection */}
      <div className="space-y-2">
        <Label>Request Type</Label>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="request-type-single"
              checked={formData.requestType.single}
              onCheckedChange={() => handleRequestTypeChange("single")}
            />
            <Label htmlFor="request-type-single">Single</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="request-type-multiple"
              checked={formData.requestType.multiple}
              onCheckedChange={() => handleRequestTypeChange("multiple")}
            />
            <Label htmlFor="request-type-multiple">Multiple</Label>
          </div>
        </div>
      </div>

      {/* Entry Forms */}
      {formData.entries.map((entry, index) => (
        <div key={index} className="space-y-6 p-4 border rounded-lg relative">
          {/* Remove Entry Button (for multiple entries) */}
          {formData.requestType.multiple && formData.entries.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeEntry(index)}
              className="absolute top-2 right-2"
              aria-label="Remove entry"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          {/* Entry Details */}
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

          {/* MDA Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`previousMDA-${index}`}>Previous MDA</Label>
              <Input
                id={`previousMDA-${index}`}
                value={entry.previousMDA}
                onChange={(e) =>
                  handleEntryChange(index, "previousMDA", e.target.value)
                }
                className={
                  errors[`previousMDA-${index}`] ? "border-red-500" : ""
                }
              />
              {errors[`previousMDA-${index}`] && (
                <span className="text-red-500 text-sm">
                  {errors[`previousMDA-${index}`]}
                </span>
              )}
            </div>
            <div>
              <Label htmlFor={`newMDA-${index}`}>New MDA</Label>
              <Input
                id={`newMDA-${index}`}
                value={entry.newMDA}
                onChange={(e) =>
                  handleEntryChange(index, "newMDA", e.target.value)
                }
                className={errors[`newMDA-${index}`] ? "border-red-500" : ""}
              />
              {errors[`newMDA-${index}`] && (
                <span className="text-red-500 text-sm">
                  {errors[`newMDA-${index}`]}
                </span>
              )}
            </div>
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
            <Label htmlFor={`remark-${index}`}>Remark</Label>
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

      {/* Add Entry Button (for multiple requests) */}
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
    </SharedForm>
  );
};

export default RestorationMigrationForm;
