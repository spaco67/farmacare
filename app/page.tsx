import ImageUpload from "@/components/ImageUpload";

export default function Home() {
  return (
    <div className="min-h-screen py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-green-400 mb-2">FarmaCare</h1>
        <p className="text-gray-400">
          Upload a plant image for disease detection and analysis
        </p>
      </div>
      <ImageUpload />
    </div>
  );
}
