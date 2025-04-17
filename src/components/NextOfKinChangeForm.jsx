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
import { Textarea } from "@/components/ui/textarea";
import SharedForm from "./SharedForm";

// Initial empty next of kin entry object
const emptyNOKEntry = {
  employeeName: "",
  employeeIPPIS: "",
  previousNOKName: "",
  newNOKName: "",
  supportingDocs: {
    nokForm: false,
    payslip: false,
  },
  otherSupportingDocs: "",
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
      const isApproved = data.nokEntries[0].remarks === "approve";
      templatePath = isApproved
        ? "/NOK_Template_single.docx"
        : "/NOK_Template_single_rejected.docx";

      const status = isApproved ? "Approved" : "Rejected";
      fileName = `Next_of_Kin_Change_Request_${data.nokEntries[0].employeeName}_${status}.docx`;
    } else {
      // Multiple requests - check if all approved, all rejected, or mixed
      const allApproved = data.nokEntries.every(
        (entry) => entry.remarks === "approve"
      );
      const allRejected = data.nokEntries.every(
        (entry) => entry.remarks === "reject"
      );

      if (allApproved) {
        templatePath = "/NOK_Template_multiple_all_approved.docx";
        fileName =
          "Next_of_Kin_Change_Request_Multiple_Entries_All_Approved.docx";
      } else if (allRejected) {
        templatePath = "/NOK_Template_multiple_all_rejected.docx";
        fileName =
          "Next_of_Kin_Change_Request_Multiple_Entries_All_Rejected.docx";
      } else {
        templatePath = "/NOK_Template_multiple_mixed.docx";
        fileName = "Next_of_Kin_Change_Request_Multiple_Entries_Mixed.docx";
      }
    }

    // Fetch the appropriate template with proper error handling
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.statusText}`);
    }

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
      if (entry.supportingDocs.nokForm) docs.push("NOK Form");
      if (entry.supportingDocs.payslip) docs.push("Payslip");

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
      const nokEntry = data.nokEntries[0];
      const isApproved = nokEntry.remarks === "approve";

      templateData = {
        ...commonData,
        employeeName: nokEntry.employeeName,
        employeeIPPIS: nokEntry.employeeIPPIS || "N/A",
        previousNOKName: nokEntry.previousNOKName,
        newNOKName: nokEntry.newNOKName,
        supportingDocsList: getSupportingDocsList(nokEntry),
        observation: nokEntry.observation || "No observation",
        remark: isApproved
          ? "Recommended for Approved"
          : "Not Recommended for Approval",
        isApproved: isApproved,
        reasonForRejection: isApproved
          ? ""
          : nokEntry.observation || "Incomplete documentation",
      };
    } else {
      // For multiple entries
      // Prepare all entries for reference
      const detailedEntries = data.nokEntries.map((entry, index) => ({
        sn: getLetterForIndex(index),
        employeeIPPIS: entry.employeeIPPIS || "N/A",
        employeeName: entry.employeeName,
        previousNOKName: entry.previousNOKName,
        newNOKName: entry.newNOKName,
        supportingDocsList: getSupportingDocsList(entry),
        observation: entry.observation || "No observation",
        remark:
          entry.remarks === "approve"
            ? "Recommended for approval"
            : "Not Recommended for approval",
        isApproved: entry.remarks === "approve",
      }));

      // Check if all approved, all rejected, or mixed
      const allApproved = data.nokEntries.every(
        (entry) => entry.remarks === "approve"
      );
      const allRejected = data.nokEntries.every(
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
            employeeIPPIS: entry.employeeIPPIS,
            employeeName: entry.employeeName,
            previousNOK: entry.previousNOKName,
            newNOK: entry.newNOKName,
          })),
        };
      } else {
        // Mixed case: separate approved and rejected entries
        const approvedEntries = data.nokEntries
          .filter((entry) => entry.remarks === "approve")
          .map((entry, index) => ({
            sn: getLetterForIndex(index),
            employeeIPPIS: entry.employeeIPPIS || "N/A",
            employeeName: entry.employeeName,
            previousNOKName: entry.previousNOKName,
            newNOKName: entry.newNOKName,
            supportingDocsList: getSupportingDocsList(entry),
            observation: entry.observation || "No observation",
            remark: "Recommended for Approval",
          }));

        const rejectedEntries = data.nokEntries
          .filter((entry) => entry.remarks === "reject")
          .map((entry, index) => ({
            sn: getLetterForIndex(index),
            employeeIPPIS: entry.employeeIPPIS || "N/A",
            employeeName: entry.employeeName,
            previousNOKName: entry.previousNOKName,
            newNOKName: entry.newNOKName,
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
            employeeIPPIS: entry.employeeIPPIS,
            employeeName: entry.employeeName,
            previousNOK: entry.previousNOKName,
            newNOK: entry.newNOKName,
          })),
          rejectedSummary: rejectedEntries.map((entry) => ({
            sn: entry.sn,
            employeeIPPIS: entry.employeeIPPIS,
            employeeName: entry.employeeName,
            previousNOK: entry.previousNOKName,
            newNOK: entry.newNOKName,
          })),
        };
        // Inside generateDocument function
        console.log("Template data being used:", templateData);
        console.log("Template path being used:", templatePath);
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

const NextOfKinChangeForm = () => {
  // Form-specific state
  const [formData, setFormData] = useState({
    requestType: {
      single: true, // Set one to true
      multiple: false,
    },
    nokEntries: [{ ...emptyNOKEntry }],
  });

  // Form submission status
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});

  // Form-specific handlers
  const handleNOKEntryChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      nokEntries: prev.nokEntries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
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
      nokEntries: type === "single" ? [{ ...emptyNOKEntry }] : prev.nokEntries,
    }));
  };

  // Add a new NOK entry
  const addNOKEntry = () => {
    setFormData((prev) => ({
      ...prev,
      nokEntries: [...prev.nokEntries, { ...emptyNOKEntry }],
    }));
  };

  // Remove a NOK entry
  const removeNOKEntry = (index) => {
    if (formData.nokEntries.length > 1) {
      setFormData((prev) => ({
        ...prev,
        nokEntries: prev.nokEntries.filter((_, i) => i !== index),
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

    formData.nokEntries.forEach((entry, index) => {
      if (!entry.employeeName) {
        newErrors[`employeeName_${index}`] = "Employee name is required";
      }
      if (!entry.employeeIPPIS) {
        newErrors[`employeeIPPIS_${index}`] =
          "Employee IPPIS number is required";
      }

      // Previous NOK name validation
      if (!entry.previousNOKName) {
        newErrors[`previousNOKName_${index}`] = "Previous NOK name is required";
      }

      // New NOK name validation
      if (!entry.newNOKName) {
        newErrors[`newNOKName_${index}`] = "New NOK name is required";
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

  // Modify your handleSubmit function in NextOfKinChangeForm.jsx to accept commonData instead of an event
  // const handleSubmit = (commonData) => {
  //   // No need for e.preventDefault() here since it's not an event
  //   setSubmitStatus(null);

  //   if (validateForm()) {
  //     setTimeout(async () => {
  //       // Combine the common data with your form-specific data
  //       const completeFormData = {
  //         ...commonData,
  //         ...formData,
  //       };

  //       // Generate the document
  //       const docGenerated = await generateDocument(completeFormData);

  //       setSubmitStatus(docGenerated ? "success" : "error");

  //       if (docGenerated) {
  //         setTimeout(() => {
  //           setFormData({
  //             requestType: { single: false, multiple: false },
  //             nokEntries: [{ ...emptyNOKEntry }],
  //           });
  //           setSubmitStatus(null);
  //         }, 3000);
  //       }
  //     }, 1000);
  //   } else {
  //     setSubmitStatus("error");
  //   }
  //   console.log("Form submission started with data:", commonData, formData);
  // };
  const handleSubmit = async (commonData) => {
    if (!validateForm()) {
      setSubmitStatus("error");
      return;
    }

    try {
      console.log("Starting document generation with data:", {
        ...commonData,
        ...formData,
      });

      const docGenerated = await generateDocument({
        ...commonData,
        ...formData,
      });

      console.log("Document generation result:", docGenerated);

      setSubmitStatus(docGenerated ? "success" : "error");

      if (docGenerated) {
        setTimeout(() => {
          setFormData({
            requestType: { single: true, multiple: false },
            nokEntries: [{ ...emptyNOKEntry }],
          });
          setSubmitStatus(null);
        }, 3000);
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      setSubmitStatus("error");
    }
  };

  const handleReset = () => {
    setFormData({
      reference: "",
      date: null,
      mda: "",
      address: "",
      recipient: "",
      requestType: { single: true, multiple: false },
      nokEntries: [{ ...emptyNOKEntry }],
    });
    setErrors({});
    setSubmitStatus(null);
  };

  return (
    <SharedForm
      title="Change of Next of Kin Request Form"
      onSubmit={handleSubmit}
      onReset={handleReset}
      submitStatus={submitStatus}
      showSuccessMessage="Next of Kin change request submitted successfully!"
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

      {formData.nokEntries.map((entry, index) => (
        <div key={index} className="space-y-6 p-4 border rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">
              Next of Kin Change Entry #{index + 1}
            </h3>
            {formData.requestType.multiple &&
              formData.nokEntries.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeNOKEntry(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
          </div>

          {/* Employee Information */}
          <div className="space-y-4 border-b pb-4">
            <h4 className="font-medium">Employee Information</h4>

            <div className="space-y-2">
              <Label
                htmlFor={`employeeName_${index}`}
                className="flex justify-between"
              >
                Employee Name
                {errors[`employeeName_${index}`] && (
                  <span className="text-red-500 text-sm">
                    {errors[`employeeName_${index}`]}
                  </span>
                )}
              </Label>
              <Input
                id={`employeeName_${index}`}
                value={entry.employeeName}
                onChange={(e) =>
                  handleNOKEntryChange(index, "employeeName", e.target.value)
                }
                className={
                  errors[`employeeName_${index}`] ? "border-red-500" : ""
                }
                placeholder="Enter employee name"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor={`employeeIPPIS_${index}`}
                className="flex justify-between"
              >
                Employee IPPIS Number
                {errors[`employeeIPPIS_${index}`] && (
                  <span className="text-red-500 text-sm">
                    {errors[`employeeIPPIS_${index}`]}
                  </span>
                )}
              </Label>
              <Input
                id={`employeeIPPIS_${index}`}
                value={entry.employeeIPPIS}
                onChange={(e) =>
                  handleNOKEntryChange(index, "employeeIPPIS", e.target.value)
                }
                className={
                  errors[`employeeIPPIS_${index}`] ? "border-red-500" : ""
                }
                placeholder="Enter employee IPPIS number"
              />
            </div>
          </div>

          {/* Previous Next of Kin Information - Simplified */}
          <div className="space-y-4 border-b pb-4">
            <h4 className="font-medium">Previous Next of Kin</h4>

            <div className="space-y-2">
              <Label
                htmlFor={`previousNOKName_${index}`}
                className="flex justify-between"
              >
                Name
                {errors[`previousNOKName_${index}`] && (
                  <span className="text-red-500 text-sm">
                    {errors[`previousNOKName_${index}`]}
                  </span>
                )}
              </Label>
              <Input
                id={`previousNOKName_${index}`}
                value={entry.previousNOKName}
                onChange={(e) =>
                  handleNOKEntryChange(index, "previousNOKName", e.target.value)
                }
                className={
                  errors[`previousNOKName_${index}`] ? "border-red-500" : ""
                }
                placeholder="Enter previous NOK name"
              />
            </div>
          </div>

          {/* New Next of Kin Information - Simplified */}
          <div className="space-y-4 border-b pb-4">
            <h4 className="font-medium">New Next of Kin</h4>

            <div className="space-y-2">
              <Label
                htmlFor={`newNOKName_${index}`}
                className="flex justify-between"
              >
                Name
                {errors[`newNOKName_${index}`] && (
                  <span className="text-red-500 text-sm">
                    {errors[`newNOKName_${index}`]}
                  </span>
                )}
              </Label>
              <Input
                id={`newNOKName_${index}`}
                value={entry.newNOKName}
                onChange={(e) =>
                  handleNOKEntryChange(index, "newNOKName", e.target.value)
                }
                className={
                  errors[`newNOKName_${index}`] ? "border-red-500" : ""
                }
                placeholder="Enter new NOK name"
              />
            </div>
          </div>

          {/* Supporting Documents */}
          <div className="space-y-4 border-b pb-4">
            <h4 className="font-medium flex justify-between">
              Supporting Documents
              {errors[`supportingDocs_${index}`] && (
                <span className="text-red-500 text-sm">
                  {errors[`supportingDocs_${index}`]}
                </span>
              )}
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`nokForm_${index}`}
                  checked={entry.supportingDocs.nokForm}
                  onCheckedChange={() =>
                    handleNOKEntryChange(index, "supportingDocs", {
                      ...entry.supportingDocs,
                      nokForm: !entry.supportingDocs.nokForm,
                    })
                  }
                />
                <Label htmlFor={`nokForm_${index}`}>NOK Form</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`payslip_${index}`}
                  checked={entry.supportingDocs.payslip}
                  onCheckedChange={() =>
                    handleNOKEntryChange(index, "supportingDocs", {
                      ...entry.supportingDocs,
                      payslip: !entry.supportingDocs.payslip,
                    })
                  }
                />
                <Label htmlFor={`payslip_${index}`}>Payslip</Label>
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
                  handleNOKEntryChange(
                    index,
                    "otherSupportingDocs",
                    e.target.value
                  )
                }
                placeholder="Enter any additional documents"
              />
            </div>
          </div>

          {/* Observation and Remarks */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`observation_${index}`}>Observation</Label>
              <Textarea
                id={`observation_${index}`}
                value={entry.observation}
                onChange={(e) =>
                  handleNOKEntryChange(index, "observation", e.target.value)
                }
                placeholder="Enter any observations"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor={`remarks_${index}`}
                className="flex justify-between"
              >
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
                  handleNOKEntryChange(index, "remarks", value)
                }
              >
                <SelectTrigger
                  className={errors[`remarks_${index}`] ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}

      {formData.requestType.multiple && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={addNOKEntry}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Entry
        </Button>
      )}
    </SharedForm>
  );
};

export default NextOfKinChangeForm;
