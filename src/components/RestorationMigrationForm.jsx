// import  { useState } from 'react';
// //import { useForm } from 'react-hook-form';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Checkbox } from '@/components/ui/checkbox';
// import { Label } from '@/components/ui/label';
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// //import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { PlusCircle, X } from 'lucide-react';

// const RestoreForm = () => {
//   const [requestType, setRequestType] = useState('single');
//   const [multipleEntries, setMultipleEntries] = useState([]);
//   const [submitted, setSubmitted] = useState(false);
//   const [error, setError] = useState('');

//   const supportingDocOptions = [
//     { id: 'posting', label: 'Posting Instruction' },
//     { id: 'payslip', label: 'Payslip' },
//     { id: 'assumption', label: 'Assumption of Duty' },
//     { id: 'idcard', label: 'ID Card' }
//   ];

//   const defaultEntry = {
//     name: '',
//     ippisNumber: '',
//     previousMDA: '',
//     newMDA: '',
//     supportingDocs: [],
//     otherDocs: '',
//     observation: '',
//     remark: ''
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     // Basic validation
//     if (!document.getElementById('referenceNumber').value) {
//       setError('Reference number is required');
//       return;
//     }

//     // Submit logic would go here
//     setSubmitted(true);
//     setError('');
//   };

//   const addNewEntry = () => {
//     setMultipleEntries([...multipleEntries, { ...defaultEntry }]);
//   };

//   const removeEntry = (index) => {
//     const newEntries = multipleEntries.filter((_, i) => i !== index);
//     setMultipleEntries(newEntries);
//   };

//   const SingleEntryForm = ({ isMultiple = false, index = 0, onRemove = null }) => (
//     <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
//       {isMultiple && (
//         <div className="flex justify-between items-center">
//           <h3 className="text-lg font-medium">Entry {index + 1}</h3>
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={() => onRemove(index)}
//             className="text-red-500"
//           >
//             <X className="h-4 w-4" />
//           </Button>
//         </div>
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div className="space-y-2">
//           <Label htmlFor={`name-${index}`}>Name</Label>
//           <Input
//             id={`name-${index}`}
//             placeholder="Enter full name"
//             className="w-full"
//           />
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor={`ippis-${index}`}>IPPIS Number</Label>
//           <Input
//             id={`ippis-${index}`}
//             placeholder="Enter IPPIS number"
//             className="w-full"
//           />
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor={`previousMDA-${index}`}>Previous MDA</Label>
//           <Input
//             id={`previousMDA-${index}`}
//             placeholder="Enter previous MDA"
//             className="w-full"
//           />
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor={`newMDA-${index}`}>New MDA</Label>
//           <Input
//             id={`newMDA-${index}`}
//             placeholder="Enter new MDA"
//             className="w-full"
//           />
//         </div>
//       </div>

//       <div className="space-y-4">
//         <Label>Supporting Documents</Label>
//         <div className="grid grid-cols-2 gap-4">
//           {supportingDocOptions.map((doc) => (
//             <div key={doc.id} className="flex items-center space-x-2">
//               <Checkbox id={`${doc.id}-${index}`} />
//               <Label htmlFor={`${doc.id}-${index}`}>{doc.label}</Label>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="space-y-2">
//         <Label htmlFor={`otherDocs-${index}`}>Other Supporting Documents</Label>
//         <Input
//           id={`otherDocs-${index}`}
//           placeholder="Specify other documents"
//           className="w-full"
//         />
//       </div>

//       <div className="space-y-2">
//         <Label htmlFor={`observation-${index}`}>Observation</Label>
//         <Input
//           id={`observation-${index}`}
//           placeholder="Enter observations"
//           className="w-full"
//         />
//       </div>

//       <div className="space-y-2">
//         <Label>Remark</Label>
//         <RadioGroup defaultValue="approve" className="flex space-x-4">
//           <div className="flex items-center space-x-2">
//             <RadioGroupItem value="approve" id={`approve-${index}`} />
//             <Label htmlFor={`approve-${index}`}>Approve</Label>
//           </div>
//           <div className="flex items-center space-x-2">
//             <RadioGroupItem value="reject" id={`reject-${index}`} />
//             <Label htmlFor={`reject-${index}`}>Reject</Label>
//           </div>
//         </RadioGroup>
//       </div>
//     </div>
//   );

//   return (
//     <Card className="w-full max-w-4xl mx-auto">
//       <CardHeader>
//         <CardTitle>Restoration and Migration Form</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="referenceNumber">Reference Number</Label>
//               <Input
//                 id="referenceNumber"
//                 placeholder="Enter reference number"
//                 className="w-full"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="date">Date</Label>
//               <Input
//                 id="date"
//                 type="date"
//                 className="w-full"
//               />
//             </div>
//           </div>

//           <div className="space-y-2">
//             <Label>Request Type</Label>
//             <RadioGroup
//               defaultValue="single"
//               className="flex space-x-4"
//               onValueChange={setRequestType}
//             >
//               <div className="flex items-center space-x-2">
//                 <RadioGroupItem value="single" id="single" />
//                 <Label htmlFor="single">Single</Label>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <RadioGroupItem value="multiple" id="multiple" />
//                 <Label htmlFor="multiple">Multiple</Label>
//               </div>
//             </RadioGroup>
//           </div>

//           {requestType === 'single' ? (
//             <SingleEntryForm />
//           ) : (
//             <div className="space-y-4">
//               {multipleEntries.map((entry, index) => (
//                 <SingleEntryForm
//                   key={index}
//                   isMultiple={true}
//                   index={index}
//                   onRemove={removeEntry}
//                 />
//               ))}
//               <Button
//                 type="button"
//                 onClick={addNewEntry}
//                 className="w-full"
//                 variant="outline"
//               >
//                 <PlusCircle className="h-4 w-4 mr-2" />
//                 Add New Entry
//               </Button>
//             </div>
//           )}

//           {error && (
//             <Alert variant="destructive">
//               <AlertDescription>{error}</AlertDescription>
//             </Alert>
//           )}

//           {submitted && (
//             <Alert className="bg-green-50 text-green-700">
//               <AlertDescription>Form submitted successfully!</AlertDescription>
//             </Alert>
//           )}

//           <Button type="submit" className="w-full">
//             Submit Form
//           </Button>
//         </form>
//       </CardContent>
//     </Card>
//   );
// };

// export default RestoreForm;
import { useState } from "react";
import PropTypes from "prop-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { format } from "date-fns";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";

// A reusable date picker component that provides a calendar interface for selecting dates
// It includes validation and error handling capabilities
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

// PropTypes for the DatePickerField component to ensure proper type checking
DatePickerField.propTypes = {
  value: PropTypes.instanceOf(Date),
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
};

DatePickerField.defaultProps = {
  value: null,
  error: null,
};

const RestorationMigrationForm = () => {
  // Define the initial state for a single entry in the form
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

  // Initialize the main form state with default values
  const [formData, setFormData] = useState({
    reference: "",
    date: null,
    requestType: {
      single: true,
      multiple: false,
    },
    entries: [{ ...initialEntry }],
  });

  // State management for form validation and notifications
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  // Configuration for supporting documents that can be selected
  const supportingDocuments = [
    { id: "posting", label: "Posting Instruction" },
    { id: "payslip", label: "Payslip" },
    { id: "assumption", label: "Assumption of Duty" },
    { id: "idcard", label: "ID Card" },
  ];

  // Handler for updating main form fields
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear any existing error for the updated field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  // Handler for switching between single and multiple request types
  const handleRequestTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      requestType: {
        single: type === "single",
        multiple: type === "multiple",
      },
    }));
  };

  // Handler for updating individual entry fields
  const handleEntryChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      entries: prev.entries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  // Handler for toggling document checkboxes
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

  // Function to add a new entry for multiple requests
  const addEntry = () => {
    setFormData((prev) => ({
      ...prev,
      entries: [...prev.entries, { ...initialEntry }],
    }));
  };

  // Function to remove an entry from multiple requests
  const removeEntry = (index) => {
    if (formData.entries.length > 1) {
      setFormData((prev) => ({
        ...prev,
        entries: prev.entries.filter((_, i) => i !== index),
      }));
    }
  };

  // Comprehensive form validation
  const validateForm = () => {
    const newErrors = {};

    // Validate main form fields
    if (!formData.reference) {
      newErrors.reference = "Reference number is required";
    }
    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    // Validate each entry
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

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      console.log("Form submitted:", formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      // Reset form to initial state
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
        <CardTitle>Restoration and Migration Form</CardTitle>
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
                className={`w-full ${errors.reference ? "border-red-500" : ""}`}
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
                    className={
                      errors[`newMDA-${index}`] ? "border-red-500" : ""
                    }
                  />
                  {errors[`newMDA-${index}`] && (
                    <span className="text-red-500 text-sm">
                      {errors[`newMDA-${index}`]}
                    </span>
                  )}
                </div>
              </div>

              {/* Supporting Documents Section */}
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

          {/* Submit Button */}
          <Button type="submit" className="w-full">
            Submit Form
          </Button>

          {/* Success Message */}
          {showSuccess && (
            <Alert className="mt-4 bg-green-100">
              <AlertDescription>
                Form submitted successfully! The restoration and migration
                request has been recorded.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
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

export default RestorationMigrationForm;
