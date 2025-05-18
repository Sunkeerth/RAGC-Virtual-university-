import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "react-hot-toast";
import { useLocation } from "wouter";
import { Rocket } from "lucide-react";
import { Upload, BookOpen } from "lucide-react";


import {
  DocumentTextIcon,
  AcademicCapIcon,
  IdentificationIcon,
  BriefcaseIcon,
  BookOpenIcon,
  UserCircleIcon,
  BanknotesIcon,
  CameraIcon,
  DocumentIcon,
  ClipboardDocumentIcon
} from "@heroicons/react/24/outline";
import { useNavigation } from "react-day-picker";

const DocumentTypeIcons: Record<string, React.FC<{ className?: string }>> = {
  national_id: IdentificationIcon,
  passport: IdentificationIcon,
  birth_certificate: BookOpenIcon,
  academic_transcript: AcademicCapIcon,
  marksheet: DocumentTextIcon,
  transfer_certificate: ClipboardDocumentIcon,
  admission_letter: DocumentIcon,
  entrance_result: DocumentTextIcon,
  profile_photo: CameraIcon,
  degree_certificate: AcademicCapIcon,
  ugc_net: DocumentTextIcon,
  experience_letter: BriefcaseIcon,
  resume: DocumentTextIcon,
  teacher_certification: AcademicCapIcon,
  pan_card: BanknotesIcon,
  signature: UserCircleIcon
};

const documentTypeLabels: Record<string, string> = {
  national_id: "National ID/Aadhaar Card",
  passport: "Passport",
  birth_certificate: "Birth Certificate",
  academic_transcript: "Academic Transcript",
  marksheet: "Latest Marksheet",
  transfer_certificate: "Transfer Certificate",
  admission_letter: "Admission Offer Letter",
  entrance_result: "Entrance Exam Result",
  profile_photo: "Passport Size Photo",
  degree_certificate: "Degree Certificate",
  ugc_net: "UGC/NET Certificate",
  experience_letter: "Experience Letter",
  resume: "Curriculum Vitae (CV)",
  teacher_certification: "Teaching Certification",
  pan_card: "PAN Card/Tax ID",
  signature: "Digital Signature"
};

const studentDocuments = [
  "national_id",
  "passport",
  "birth_certificate",
  "academic_transcript",
  "marksheet",
  "transfer_certificate",
  "admission_letter",
  "entrance_result",
  "profile_photo"
];

const teacherDocuments = [
  "national_id",
  "passport",
  "degree_certificate",
  "ugc_net",
  "experience_letter",
  "resume",
  "teacher_certification",
  "pan_card",
  "profile_photo",
  "signature"
];

export default function DocumentUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, navigate] = useLocation();

  // const { data: documents = [], isLoading } = useQuery({
  //   queryKey: ["documents"],
  //   queryFn: async () => {
  //     const res = await fetch("/api/documents", { credentials: "include" });
  //     if (!res.ok) throw new Error("Failed to fetch documents");
  //     return res.json();
  //   }
  // });
   const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await fetch("/api/documents", { 
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch documents");
      }
      return res.json();
    },
    retry: 1
  });

const uploadMutation = useMutation({
    mutationFn: async (data: { type: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("type", data.type);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      const response = await res.json();
      if (!res.ok) throw new Error(response.message || "Upload failed");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const requiredDocuments = user?.role === "student" ? studentDocuments : teacherDocuments;

  const getDocumentStatus = (docType: string) => {
    const doc = documents.find((d: any) => d.type === docType);
    return doc ? doc.status : "pending";
  };

  const allDocumentsApproved = requiredDocuments.every(docType => {
    const doc = documents.find((d: any) => d.type === docType);
    return doc?.status === "approved";
  });
   const handleNextPage = () => {
    navigate("/payment-form"); // Update with your actual next page route
  };

//   return (
//     <div className="h-screen flex flex-col bg-background text-foreground">
//       <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

//       <div className="flex flex-1 overflow-hidden">
//         <aside className={`${sidebarOpen ? "block" : "hidden"} lg:block w-64 border-r`}>
//           <Sidebar />
//         </aside>

//         <main className="flex-1 overflow-y-auto p-8">
//           <div className="max-w-4xl mx-auto space-y-8">
//              {error && (
//               <div className="text-red-500 p-4 bg-red-50 rounded-lg">
//                 Error: {error.message}
//               </div>
//             )}
//             <section className="bg-muted/10 p-6 rounded-xl border">
//               <h1 className="text-2xl font-bold text-primary mb-6">
//                 {user?.role === "student"
//                   ? "Student Enrollment Documents"
//                   : "Teacher Verification Documents"}
//               </h1>

//               <p className="text-muted-foreground mb-4">
//                 {user?.role === "student"
//                   ? "Please upload all required documents for enrollment verification."
//                   : "Submit verification documents for teaching position approval."}
//               </p>

//               <div className="space-y-6">
//                 {requiredDocuments.map((docType) => {
//                   const Icon = DocumentTypeIcons[docType];
//                   const docStatus = getDocumentStatus(docType);
//                   const uploadedDoc = documents.find((d: any) => d.type === docType);

//                   return (
//                     <div key={docType} className="border rounded-lg p-4 bg-background">
//                       <div className="flex items-center justify-between mb-4">
//                         <div className="flex items-center gap-4">
//                           {Icon && <Icon className="h-6 w-6 text-primary" />}
//                           <div>
//                             <h3 className="font-semibold">
//                               {documentTypeLabels[docType]}
//                             </h3>
//                             <p
//                               className={`text-sm ${
//                                 docStatus === "approved"
//                                   ? "text-green-600"
//                                   : docStatus === "rejected"
//                                   ? "text-red-600"
//                                   : "text-muted-foreground"
//                               }`}
//                             >
//                               Status: {docStatus}
//                             </p>
//                           </div>
//                         </div>
//                         {uploadedDoc?.url && (
//                           <a
//                             href={uploadedDoc.url}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="text-primary hover:underline text-sm"
//                           >
//                             View
//                           </a>
//                         )}
//                       </div>

//                       {(!uploadedDoc || docStatus === "rejected") && (
//                         <form
//   className="space-y-4"
//   onSubmit={async (e) => {
//     e.preventDefault();
//     const input = e.currentTarget.querySelector("input[type='file']") as HTMLInputElement;
//     const file = input?.files?.[0];
//     if (!file) return;
//     uploadMutation.mutate({ type: docType, file });
//   }}
// >
//   <div>
//     <Label htmlFor={`file-${docType}`}>Upload Document</Label>
//     <Input
//       type="file"
//       id={`file-${docType}`}
//       accept=".pdf,.jpg,.jpeg,.png"
//       required
//     />
//     <p className="text-sm text-muted-foreground mt-1">
//       Max file size: 5MB | Allowed formats: PDF, JPG, PNG
//     </p>
//   </div>

//   {uploadedDoc?.feedback && (
//     <p className="text-sm text-red-600">
//       Feedback: {uploadedDoc.feedback}
//     </p>
//   )}

//   <Button type="submit" className="flex items-center gap-2">
//     <Upload className="h-4 w-4" />
//     Upload
//   </Button>
// </form>

//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             </section>
            

             
//           </div>
          
//         </main>
         
//               <div className="flex justify-end mt-6">
//                 <Button onClick={handleNextPage} className="flex items-center gap-2">
//                   <Rocket className="h-4 w-4" />
//                   Continue to Payment
//                 </Button>
//               </div>
            
//       </div>
//     </div>
//   );
// }
return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <aside className={`${sidebarOpen ? "block" : "hidden"} lg:block w-64 border-r`}>
          <Sidebar />
        </aside>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {error && (
              <div className="text-red-500 p-4 bg-red-50 rounded-lg">
                Error: {error.message}
              </div>
            )}

            <section className="bg-muted/10 p-6 rounded-xl border">
              <h1 className="text-2xl font-bold text-primary mb-6">
                {user?.role === "student"
                  ? "Student Enrollment Documents"
                  : "Teacher Verification Documents"}
              </h1>

              <p className="text-muted-foreground mb-4">
                {user?.role === "student"
                  ? "Please upload all required documents for enrollment verification."
                  : "Submit verification documents for teaching position approval."}
              </p>

              <div className="space-y-6">
                {requiredDocuments.map((docType) => {
                  const Icon = DocumentTypeIcons[docType];
                  const docStatus = getDocumentStatus(docType);
                  const uploadedDoc = documents.find((d: any) => d.type === docType);

                  return (
                    <div key={docType} className="border rounded-lg p-4 bg-background">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          {Icon && <Icon className="h-6 w-6 text-primary" />}
                          <div>
                            <h3 className="font-semibold">{documentTypeLabels[docType]}</h3>
                            <p
                              className={`text-sm ${
                                docStatus === "approved"
                                  ? "text-green-600"
                                  : docStatus === "rejected"
                                  ? "text-red-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              Status: {docStatus}
                            </p>
                          </div>
                        </div>
                        {uploadedDoc?.url && (
                          <a
                            href={uploadedDoc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            View
                          </a>
                        )}
                      </div>

                      {(!uploadedDoc || docStatus === "rejected") && (
                        <form
                          className="space-y-4"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const input = e.currentTarget.querySelector("input[type='file']") as HTMLInputElement;
                            const file = input?.files?.[0];
                            if (!file) return;
                            uploadMutation.mutate({ type: docType, file });
                          }}
                        >
                          <div>
                            <Label htmlFor={`file-${docType}`}>Upload Document</Label>
                            <Input
                              type="file"
                              id={`file-${docType}`}
                              accept=".pdf,.jpg,.jpeg,.png"
                              required
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              Max file size: 5MB | Allowed formats: PDF, JPG, PNG
                            </p>
                          </div>

                          {uploadedDoc?.feedback && (
                            <p className="text-sm text-red-600">
                              Feedback: {uploadedDoc.feedback}
                            </p>
                          )}

                          <Button type="submit" className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Upload
                          </Button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ✅ Correct placement of Continue to Payment */}
            
              <div className="flex justify-end mt-6">
                <Button onClick={handleNextPage} className="flex items-center gap-2">
                  <Rocket className="h-4 w-4" />
                  Continue to Payment
                </Button>
              </div>
            
          </div>
        </main>
        
      </div>
    </div>
  );
};

