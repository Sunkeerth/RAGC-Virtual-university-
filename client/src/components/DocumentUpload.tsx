import React, { useState } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DocumentTextIcon,
  AcademicCapIcon,
  IdentificationIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";

// Icon mapping
const DocumentTypeIcons: Record<string, React.FC<{ className?: string }>> = {
  student_id: IdentificationIcon,
  academic_transcript: AcademicCapIcon,
  teacher_certification: DocumentTextIcon,
  experience_letter: BriefcaseIcon,
};

type FormData = {
  type: string;
  file: FileList;
};

export default function DocumentUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { register, handleSubmit, reset } = useForm<FormData>();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await fetch("/api/documents", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      formData.append("document", data.file[0]);
      formData.append("type", data.type);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      reset();
    },
  });

  const documentTypes =
    user?.role === "student"
      ? [
          { value: "student_id", label: "Student ID" },
          { value: "academic_transcript", label: "Academic Transcript" },
        ]
      : [
          { value: "teacher_certification", label: "Teaching Certification" },
          { value: "experience_letter", label: "Experience Letter" },
        ];

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 overflow-hidden">
        <aside className={`${sidebarOpen ? "block" : "hidden"} lg:block`}>
          <Sidebar />
        </aside>

        <main className="flex-1 overflow-y-auto bg-background px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <section>
              <h1 className="text-3xl font-bold text-primary text-center mb-6">
                Upload Your Documents
              </h1>

              <form
                onSubmit={handleSubmit((data) => uploadMutation.mutate(data))}
                className="space-y-6 bg-muted/20 p-6 rounded-lg border"
              >
                <div className="space-y-4">
                  {/* Document Type Selector */}
                  <div>
                    <Label htmlFor="type" className="mb-2">
                      Document Type
                    </Label>
                    <Select
                      onValueChange={(val) => {
                        const hiddenInput = document.getElementById("type") as HTMLInputElement;
                        if (hiddenInput) hiddenInput.value = val;
                      }}
                      required
                    >
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
                    <input type="hidden" id="type" {...register("type")} required />
                  </div>

                  {/* File Upload */}
                  <div>
                    <Label htmlFor="file" className="mb-2">
                      Upload Document
                    </Label>
                    <Input
                      type="file"
                      id="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      {...register("file")}
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Allowed formats: PDF, JPG, PNG (Max 5MB)
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={uploadMutation.isPending}
                  className="w-full"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
                </Button>
              </form>
            </section>

            {/* Uploaded Documents */}
            <section>
              <h2 className="text-xl font-semibold text-primary mb-4">
                Uploaded Documents
              </h2>
              {isLoading ? (
                <p className="text-muted-foreground text-center py-4">
                  Loading documents...
                </p>
              ) : documents.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No documents uploaded yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc: any) => {
                    const Icon = DocumentTypeIcons[doc.type];
                    return (
                      <div
                        key={doc.url}
                        className="border rounded-lg p-4 bg-muted/10 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          {Icon && <Icon className="h-6 w-6 text-primary" />}
                          <div>
                            <p className="font-medium capitalize">{doc.type.replace(/_/g, " ")}</p>
                            <p
                              className={`text-sm ${
                                doc.status === "approved"
                                  ? "text-green-600"
                                  : doc.status === "rejected"
                                  ? "text-red-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              Status: {doc.status}
                            </p>
                            {doc.feedback && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Feedback: {doc.feedback}
                              </p>
                            )}
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm font-medium"
                        >
                          View Document
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
