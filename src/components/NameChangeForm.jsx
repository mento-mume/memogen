import { useState } from "react";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import { format } from "date-fns";

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
import { Plus, Trash2 } from "lucide-react";
import SharedForm from "./SharedForm";

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

      const status = isApproved
        ? "Recommended for Approval"
        : "Not Recommended for Approval";
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
        templatePath = "/CON_Template_multiple.docx";
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
      recipient: data.recipient,
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
        remark: isApproved
          ? "Not Recommended for Approval"
          : "Recommended for Approval",
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
        remark:
          entry.remarks === "approve"
            ? "Recommended for Approval"
            : "Not Recommended for Approval",
        isApproved: entry.remarks === "Recommended for Approval",
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
            remark: "Recommended for Approval",
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
            remark: "Not Recommended for Approval",
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
  // Form-specific state
  const [formData, setFormData] = useState({
    requestType: {
      single: false,
      multiple: false,
    },
    nameEntries: [{ ...emptyNameEntry }],
  });

  // Form submission status
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});

  // Form-specific handlers
  const handleNameEntryChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      nameEntries: prev.nameEntries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
    }));
  };

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

  const addNameEntry = () => {
    setFormData((prev) => ({
      ...prev,
      nameEntries: [...prev.nameEntries, { ...emptyNameEntry }],
    }));
  };

  const removeNameEntry = (index) => {
    if (formData.nameEntries.length > 1) {
      setFormData((prev) => ({
        ...prev,
        nameEntries: prev.nameEntries.filter((_, i) => i !== index),
      }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.requestType.single && !formData.requestType.multiple) {
      newErrors.requestType = "Please select a request type";
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

  // Form submission handler
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
        setTimeout(() => {
          setFormData({
            requestType: { single: false, multiple: false },
            nameEntries: [{ ...emptyNameEntry }],
          });
          setSubmitStatus(null);
        }, 3000);
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      setSubmitStatus("error");
    }
  };

  // Form reset handler
  const handleReset = () => {
    setFormData({
      requestType: { single: false, multiple: false },
      nameEntries: [{ ...emptyNameEntry }],
    });
    setSubmitStatus(null);
  };

  return (
    <SharedForm
      title="Change of Name Request Form"
      onSubmit={handleSubmit}
      onReset={handleReset}
      submitStatus={submitStatus}
      showSuccessMessage="Name change request submitted successfully!"
      showErrorMessage="Please correct the errors in the form."
    >
      <div className="space-y-2">
        <Label className="flex justify-between">
          Request Type
          {errors?.requestType && (
            <span className="text-red-500 text-sm">{errors.requestType}</span>
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

          {/* Entry Fields */}
          <div className="space-y-2">
            <Label
              htmlFor={`previousName_${index}`}
              className="flex justify-between"
            >
              Previous Name
              {errors?.[`previousName_${index}`] && (
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
                errors?.[`previousName_${index}`] ? "border-red-500" : ""
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
              {errors?.[`newName_${index}`] && (
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
              className={errors?.[`newName_${index}`] ? "border-red-500" : ""}
              placeholder="Enter new name"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor={`ippisNumber_${index}`}
              className="flex justify-between"
            >
              IPPIS Number
              {errors?.[`ippisNumber_${index}`] && (
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
                errors?.[`ippisNumber_${index}`] ? "border-red-500" : ""
              }
              placeholder="Enter IPPIS Number"
            />
          </div>

          {/* Supporting Documents */}
          <div className="space-y-2">
            <Label className="flex justify-between">
              Supporting Documents
              {errors?.[`supportingDocs_${index}`] && (
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
              {errors?.[`remarks_${index}`] && (
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
                className={errors?.[`remarks_${index}`] ? "border-red-500" : ""}
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
    </SharedForm>
  );
};

export default NameChangeForm;
