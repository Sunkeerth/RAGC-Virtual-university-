import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { DocumentTextIcon, AcademicCapIcon, IdentificationIcon, BriefcaseIcon } from "@heroicons/react/24/outline";

type FormData = {
  type: string;
  file: FileList;
};

const DocumentTypeIcons: Record<string, React.FC<{ className?: string }>> = {
  student_id: IdentificationIcon,
  academic_transcript: AcademicCapIcon,
  teacher_certification: DocumentTextIcon,
  experience_letter: BriefcaseIcon
};

export function DocumentUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<FormData>();

  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await fetch('/api/documents', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      formData.append('document', data.file[0]);
      formData.append('type', data.type);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      reset();
    }
  });

  const documentTypes = user?.role === 'student' ? [
    { value: 'student_id', label: 'Student ID' },
    { value: 'academic_transcript', label: 'Academic Transcript' }
  ] : [
    { value: 'teacher_certification', label: 'Teaching Certification' },
    { value: 'experience_letter', label: 'Experience Letter' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Document Management</h2>
        
        <form 
          onSubmit={handleSubmit(data => uploadMutation.mutate(data))}
          className="space-y-6 mb-12"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </Label>
              <Select {...register('type')} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                Document File
              </Label>
              <Input 
                type="file" 
                id="file"
                accept=".pdf,.jpg,.jpeg,.png"
                {...register('file')}
                required
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <p className="mt-1 text-sm text-gray-500">
                PDF, JPG, or PNG (Max 5MB)
              </p>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={uploadMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
          </Button>
        </form>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Uploaded Documents</h3>
          <div className="space-y-4">
            {documents?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No documents uploaded yet</p>
            ) : (
              documents?.map((doc: any) => {
                const Icon = DocumentTypeIcons[doc.type];
                return (
                  <div key={doc.url} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {Icon && <Icon className="h-6 w-6 text-blue-600" />}
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {doc.type.replace(/_/g, ' ')}
                          </p>
                          <p className={`text-sm ${
                            doc.status === 'approved' ? 'text-green-600' :
                            doc.status === 'rejected' ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            Status: {doc.status}
                          </p>
                          {doc.feedback && (
                            <p className="text-sm text-gray-500 mt-1">
                              Feedback: {doc.feedback}
                            </p>
                          )}
                        </div>
                      </div>
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Document
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}