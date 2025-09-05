import { BulkUploader } from "@/components/upload/bulk-uploader";

export default function UploadPage() {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight font-headline">Bulk Upload Packages & Activities</h2>
      </div>
      <BulkUploader />
    </div>
  );
}
