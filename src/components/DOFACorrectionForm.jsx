import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PropTypes from "prop-types";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";

// Reusable date picker component
const DatePickerField = ({ value, onChange, label, error }) => (
  <div className="flex flex-col space-y-2">
    <Label>{label}</Label>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal ${
            error ? "border-red-500" : ""
          }`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : "Select date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
    {error && <span className="text-red-500 text-sm">{error}</span>}
  </div>
);
// PropTypes validation for DatePickerField
DatePickerField.propTypes = {
  // Value can be either a Date object or null
  value: PropTypes.instanceOf(Date),
  // onChange is a required function that handles date selection
  onChange: PropTypes.func.isRequired,
  // Label is a required string to display above the date picker
  label: PropTypes.string.isRequired,
  // Error is an optional string for displaying validation errors
  error: PropTypes.string,
};

// Default props for DatePickerField
DatePickerField.defaultProps = {
  value: null,
  error: null,
};

const DOFACorrectionForm = () => {
  // Initial state for a single entry
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

  // Main form state
  const [formData, setFormData] = useState({
    reference: "",
    date: null,
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

    formData.entries.forEach((entry, index) => {
      if (!entry.name) newErrors[`name-${index}`] = "Name is required";
      if (!entry.ippis)
        newErrors[`ippis-${index}`] = "IPPIS number is required";
      if (!entry.previousDOFA)
        newErrors[`previousDOFA-${index}`] = "Previous DOFA is required";
      if (!entry.newDOFA)
        newErrors[`newDOFA-${index}`] = "New DOFA is required";

      // Check if new DOFA is before previous DOFA
      if (
        entry.previousDOFA &&
        entry.newDOFA &&
        entry.newDOFA > entry.previousDOFA
      ) {
        newErrors[`newDOFA-${index}`] =
          "New DOFA must be before or equal to Previous DOFA";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      console.log("Form submitted:", formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      // Reset form
      setFormData({
        reference: "",
        date: null,
        requestType: {
          single: true,
          multiple: false,
        },
        entries: [{ ...initialEntry }],
      });
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
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
