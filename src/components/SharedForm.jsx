import { useState } from "react";
import PropTypes from "prop-types";
import { RECIPIENTS } from "@/constants/formConstants";

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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import DatePickerField from "@/components/DatePickerField";

const SharedForm = ({
  title,
  children,
  onSubmit,
  onReset,
  submitStatus,
  showSuccessMessage = "Form submitted successfully!",
  showErrorMessage = "Please correct the errors in the form.",
}) => {
  // Common form state
  const [formData, setFormData] = useState({
    reference: "",
    date: null,
    mda: "",
    address: "",
    recipient: "",
  });

  // Common validation state
  const [errors, setErrors] = useState({});

  // Common input change handler
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

  // Common validation function
  const validateCommonFields = () => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Common form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateCommonFields()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {submitStatus === "success" && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{showSuccessMessage}</AlertDescription>
            </Alert>
          )}
          {submitStatus === "error" && (
            <Alert className="bg-red-50 text-red-800 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{showErrorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Common Form Fields */}
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
              <SelectTrigger>
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {RECIPIENTS.map((recipient) => (
                  <SelectItem key={recipient} value={recipient}>
                    {recipient}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Form-specific content */}
          {children}
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
                recipient: "",
              });
              setErrors({});
              onReset();
            }}
          >
            Reset
          </Button>
          <Button type="submit">Submit</Button>
        </CardFooter>
      </Card>
    </form>
  );
};

SharedForm.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  submitStatus: PropTypes.oneOf(["success", "error", null]),
  showSuccessMessage: PropTypes.string,
  showErrorMessage: PropTypes.string,
};

export default SharedForm;
