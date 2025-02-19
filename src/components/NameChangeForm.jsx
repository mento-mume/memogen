import { useState } from "react";
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
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
} from "lucide-react";

// Initial empty name entry object
const emptyNameEntry = {
  previousName: "",
  newName: "",
  supportingDocs: {
    newspaper: false,
    marriageCert: false,
    courtAffidavit: false,
  },
  observation: "",
  remarks: "",
};

const NameChangeForm = () => {
  // State to manage form data
  const [formData, setFormData] = useState({
    reference: "",
    date: null,
    requestType: {
      single: false,
      multiple: false,
    },
    nameEntries: [{ ...emptyNameEntry }],
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
      if (!Object.values(entry.supportingDocs).some(Boolean)) {
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

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitStatus(null);

    if (validateForm()) {
      setTimeout(() => {
        setSubmitStatus("success");
        setTimeout(() => {
          setFormData({
            reference: "",
            date: null,
            requestType: { single: false, multiple: false },
            nameEntries: [{ ...emptyNameEntry }],
          });
          setSubmitStatus(null);
        }, 3000);
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
