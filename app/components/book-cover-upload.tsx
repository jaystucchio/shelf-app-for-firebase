
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Book } from "@/lib/types";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export function BookCoverUpload({ book, onUploadComplete }: { book: Book; onUploadComplete: (newCoverUrl: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `book-covers/${book.key}/${file.name}`);
      await uploadBytes(storageRef, file);
      const newCoverUrl = await getDownloadURL(storageRef);

      onUploadComplete(newCoverUrl);

      toast({
        title: "Upload successful",
        description: "Your new book cover has been uploaded.",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your book cover.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="book-cover-upload">Change Book Cover</Label>
      <Input id="book-cover-upload" type="file" onChange={handleFileChange} />
      <Button onClick={handleUpload} disabled={isUploading || !file}>
        {isUploading ? "Uploading..." : "Upload"}
      </Button>
    </div>
  );
}
