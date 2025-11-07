import MacBootLoader from "@/components/macos/MacBootLoader";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <MacBootLoader />
    </div>
  );
}


