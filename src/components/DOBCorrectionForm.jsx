// import { useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Checkbox } from '@/components/ui/checkbox';
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Calendar } from '@/components/ui/calendar';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { format } from 'date-fns';
// import { Calendar as CalendarIcon } from 'lucide-react';

// const DOBCorrectionForm = () => {
//   const [isMultiple, setIsMultiple] = useState(false);
//   const [corrections, setCorrections] = useState([{}]);
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [showError, setShowError] = useState(false);

//   const supportingDocuments = [
//     { id: 'dob', label: 'Birth Certificate' },
//     { id: 'payslip', label: 'Payslip' },
//     { id: 'primary', label: 'Primary School Certificate' },
//     { id: 'service', label: 'Record of Service' }
//   ];

//   const { register, handleSubmit, formState: { errors }, reset } = useForm();

//   const addNewCorrection = () => {
//     setCorrections([...corrections, {}]);
//   };

//   const removeCorrection = (index) => {
//     const newCorrections = corrections.filter((_, i) => i !== index);
//     setCorrections(newCorrections);
//   };

//   const onSubmit = (data) => {
//     console.log('Form submitted:', data);
//     setShowSuccess(true);
//     setTimeout(() => setShowSuccess(false), 3000);
//     reset();
//   };

//   const DatePickerInput = ({ label, error, ...props }) => (
//     <div className="flex flex-col space-y-2">
//       <Label>{label}</Label>
//       <Popover>
//         <PopoverTrigger asChild>
//           <Button variant="outline" className="w-full justify-start text-left font-normal">
//             <CalendarIcon className="mr-2 h-4 w-4" />
//             {props.value ? format(props.value, 'PPP') : 'Select date'}
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className="w-auto p-0">
//           <Calendar
//             mode="single"
//             selected={props.value}
//             onSelect={props.onChange}
//             initialFocus
//           />
//         </PopoverContent>
//       </Popover>
//       {error && <span className="text-red-500 text-sm">{error.message}</span>}
//     </div>
//   );

//   return (
//     <Card className="w-full max-w-4xl mx-auto">
//       <CardHeader>
//         <CardTitle>Date of Birth Correction Form</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//           {/* Header Section */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <Label htmlFor="reference">Reference Number</Label>
//               <Input
//                 id="reference"
//                 {...register('reference', { required: 'Reference number is required' })}
//                 className="w-full"
//               />
//               {errors.reference && (
//                 <span className="text-red-500 text-sm">{errors.reference.message}</span>
//               )}
//             </div>
//             <div>
//               <Label htmlFor="date">Date</Label>
//               <DatePickerInput
//                 label="Date"
//                 {...register('date', { required: 'Date is required' })}
//                 error={errors.date}
//               />
//             </div>
//           </div>

//           {/* Request Type */}
//           <div className="space-y-2">
//             <Label>Request Type</Label>
//             <div className="flex space-x-4">
//               <div className="flex items-center space-x-2">
//                 <Checkbox
//                   id="single"
//                   checked={!isMultiple}
//                   onCheckedChange={() => setIsMultiple(false)}
//                 />
//                 <Label htmlFor="single">Single</Label>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <Checkbox
//                   id="multiple"
//                   checked={isMultiple}
//                   onCheckedChange={() => setIsMultiple(true)}
//                 />
//                 <Label htmlFor="multiple">Multiple</Label>
//               </div>
//             </div>
//           </div>

//           {/* Correction Details */}
//           {corrections.map((_, index) => (
//             <div key={index} className="space-y-6 p-4 border rounded-lg">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor={`name-${index}`}>Name</Label>
//                   <Input
//                     id={`name-${index}`}
//                     {...register(`corrections.${index}.name`, { required: 'Name is required' })}
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor={`ippis-${index}`}>IPPIS Number</Label>
//                   <Input
//                     id={`ippis-${index}`}
//                     {...register(`corrections.${index}.ippis`, { required: 'IPPIS number is required' })}
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <DatePickerInput
//                   label="Previous DOB"
//                   {...register(`corrections.${index}.previousDOB`, { required: 'Previous DOB is required' })}
//                   error={errors?.corrections?.[index]?.previousDOB}
//                 />
//                 <DatePickerInput
//                   label="New DOB"
//                   {...register(`corrections.${index}.newDOB`, { required: 'New DOB is required' })}
//                   error={errors?.corrections?.[index]?.newDOB}
//                 />
//               </div>

//               {/* Supporting Documents */}
//               <div className="space-y-2">
//                 <Label>Supporting Documents</Label>
//                 <div className="grid grid-cols-2 gap-4">
//                   {supportingDocuments.map((doc) => (
//                     <div key={doc.id} className="flex items-center space-x-2">
//                       <Checkbox
//                         id={`${doc.id}-${index}`}
//                         {...register(`corrections.${index}.documents.${doc.id}`)}
//                       />
//                       <Label htmlFor={`${doc.id}-${index}`}>{doc.label}</Label>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div>
//                 <Label htmlFor={`other-docs-${index}`}>Other Supporting Documents</Label>
//                 <Input
//                   id={`other-docs-${index}`}
//                   {...register(`corrections.${index}.otherDocuments`)}
//                 />
//               </div>

//               <div>
//                 <Label htmlFor={`observation-${index}`}>Observation</Label>
//                 <Input
//                   id={`observation-${index}`}
//                   {...register(`corrections.${index}.observation`)}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label>Remark</Label>
//                 <RadioGroup defaultValue="approve">
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem
//                       value="approve"
//                       id={`approve-${index}`}
//                       {...register(`corrections.${index}.remark`)}
//                     />
//                     <Label htmlFor={`approve-${index}`}>Approve</Label>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <RadioGroupItem
//                       value="reject"
//                       id={`reject-${index}`}
//                       {...register(`corrections.${index}.remark`)}
//                     />
//                     <Label htmlFor={`reject-${index}`}>Reject</Label>
//                   </div>
//                 </RadioGroup>
//               </div>

//               {isMultiple && corrections.length > 1 && (
//                 <Button
//                   type="button"
//                   variant="destructive"
//                   onClick={() => removeCorrection(index)}
//                   className="mt-2"
//                 >
//                   Remove
//                 </Button>
//               )}
//             </div>
//           ))}

//           {isMultiple && (
//             <Button type="button" onClick={addNewCorrection} className="w-full">
//               Add Another Correction
//             </Button>
//           )}

//           <Button type="submit" className="w-full">Submit Form</Button>
//         </form>

//         {showSuccess && (
//           <Alert className="mt-4 bg-green-100">
//             <AlertDescription>
//               Form submitted successfully!
//             </AlertDescription>
//           </Alert>
//         )}

//         {showError && (
//           <Alert className="mt-4 bg-red-100">
//             <AlertDescription>
//               There was an error submitting the form. Please try again.
//             </AlertDescription>
//           </Alert>
//         )}
//       </CardContent>
//     </Card>
//   );
// };

// export default DOBCorrectionForm;
import { useState } from "react";
import PropTypes from "prop-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

const DOBCorrectionForm = () => {
  // Initialize form state with a single correction entry
  const initialCorrectionState = {
    name: "",
    ippis: "",
    previousDOB: null,
    newDOB: null,
    documents: {
      dob: false,
      payslip: false,
      primary: false,
      service: false,
    },
    otherDocuments: "",
    observation: "",
    remark: "approve",
  };

  // Main form state
  const [formData, setFormData] = useState({
    reference: "",
    date: null,
    isMultiple: false,
    corrections: [{ ...initialCorrectionState }],
  });

  // Error state management
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  // Supporting documents options
  const supportingDocuments = [
    { id: "dob", label: "Birth Certificate" },
    { id: "payslip", label: "Payslip" },
    { id: "primary", label: "Primary School Certificate" },
    { id: "service", label: "Record of Service" },
  ];

  // Handle input changes for the main form fields
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for the field when it's changed
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  // Handle changes for correction entries
  const handleCorrectionChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      corrections: prev.corrections.map((correction, i) =>
        i === index ? { ...correction, [field]: value } : correction
      ),
    }));
  };

  // Handle document checkbox changes
  const handleDocumentChange = (index, docId, checked) => {
    setFormData((prev) => ({
      ...prev,
      corrections: prev.corrections.map((correction, i) =>
        i === index
          ? {
              ...correction,
              documents: {
                ...correction.documents,
                [docId]: checked,
              },
            }
          : correction
      ),
    }));
  };

  // Add new correction entry
  const addNewCorrection = () => {
    setFormData((prev) => ({
      ...prev,
      corrections: [...prev.corrections, { ...initialCorrectionState }],
    }));
  };

  // Remove correction entry
  const removeCorrection = (index) => {
    setFormData((prev) => ({
      ...prev,
      corrections: prev.corrections.filter((_, i) => i !== index),
    }));
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};

    if (!formData.reference)
      newErrors.reference = "Reference number is required";
    if (!formData.date) newErrors.date = "Date is required";

    formData.corrections.forEach((correction, index) => {
      if (!correction.name) newErrors[`name-${index}`] = "Name is required";
      if (!correction.ippis)
        newErrors[`ippis-${index}`] = "IPPIS number is required";
      if (!correction.previousDOB)
        newErrors[`previousDOB-${index}`] = "Previous DOB is required";
      if (!correction.newDOB)
        newErrors[`newDOB-${index}`] = "New DOB is required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
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
        isMultiple: false,
        corrections: [{ ...initialCorrectionState }],
      });
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  // Date picker component with error handling
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
  // Add prop validation for the DatePickerField component
  DatePickerField.propTypes = {
    // The value prop can be either a Date object or null
    value: PropTypes.instanceOf(Date),
    // onChange should be a required function
    onChange: PropTypes.func.isRequired,
    // label should be a required string
    label: PropTypes.string.isRequired,
    // error can be either a string or null/undefined
    error: PropTypes.string,
  };

  // Add default props to handle cases where optional props aren't provided
  DatePickerField.defaultProps = {
    value: null,
    error: null,
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Date of Birth Correction Form</CardTitle>
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
            <div>
              <DatePickerField
                label="Date"
                value={formData.date}
                onChange={(date) => handleInputChange("date", date)}
                error={errors.date}
              />
            </div>
          </div>

          {/* Request Type */}
          <div className="space-y-2">
            <Label>Request Type</Label>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="single"
                  checked={!formData.isMultiple}
                  onCheckedChange={() => handleInputChange("isMultiple", false)}
                />
                <Label htmlFor="single">Single</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="multiple"
                  checked={formData.isMultiple}
                  onCheckedChange={() => handleInputChange("isMultiple", true)}
                />
                <Label htmlFor="multiple">Multiple</Label>
              </div>
            </div>
          </div>

          {/* Correction Details */}
          {formData.corrections.map((correction, index) => (
            <div key={index} className="space-y-6 p-4 border rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`name-${index}`}>Name</Label>
                  <Input
                    id={`name-${index}`}
                    value={correction.name}
                    onChange={(e) =>
                      handleCorrectionChange(index, "name", e.target.value)
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
                    value={correction.ippis}
                    onChange={(e) =>
                      handleCorrectionChange(index, "ippis", e.target.value)
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePickerField
                  label="Previous DOB"
                  value={correction.previousDOB}
                  onChange={(date) =>
                    handleCorrectionChange(index, "previousDOB", date)
                  }
                  error={errors[`previousDOB-${index}`]}
                />
                <DatePickerField
                  label="New DOB"
                  value={correction.newDOB}
                  onChange={(date) =>
                    handleCorrectionChange(index, "newDOB", date)
                  }
                  error={errors[`newDOB-${index}`]}
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
                        checked={correction.documents[doc.id]}
                        onCheckedChange={(checked) =>
                          handleDocumentChange(index, doc.id, checked)
                        }
                      />
                      <Label htmlFor={`${doc.id}-${index}`}>{doc.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor={`other-docs-${index}`}>
                  Other Supporting Documents
                </Label>
                <Input
                  id={`other-docs-${index}`}
                  value={correction.otherDocuments}
                  onChange={(e) =>
                    handleCorrectionChange(
                      index,
                      "otherDocuments",
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <Label htmlFor={`observation-${index}`}>Observation</Label>
                <Input
                  id={`observation-${index}`}
                  value={correction.observation}
                  onChange={(e) =>
                    handleCorrectionChange(index, "observation", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Remark</Label>
                <RadioGroup
                  value={correction.remark}
                  onValueChange={(value) =>
                    handleCorrectionChange(index, "remark", value)
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="approve" id={`approve-${index}`} />
                    <Label htmlFor={`approve-${index}`}>Approve</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="reject" id={`reject-${index}`} />
                    <Label htmlFor={`reject-${index}`}>Reject</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.isMultiple && formData.corrections.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeCorrection(index)}
                  className="mt-2"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}

          {formData.isMultiple && (
            <Button type="button" onClick={addNewCorrection} className="w-full">
              Add Another Correction
            </Button>
          )}

          <Button type="submit" className="w-full">
            Submit Form
          </Button>
        </form>

        {showSuccess && (
          <Alert className="mt-4 bg-green-100">
            <AlertDescription>Form submitted successfully!</AlertDescription>
          </Alert>
        )}

        {showError && (
          <Alert className="mt-4 bg-red-100">
            <AlertDescription>
              Please fill in all required fields correctly.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DOBCorrectionForm;
