import { forwardRef } from "react";
import { format } from "date-fns";

interface Prescription {
  id: string;
  prescription_date: string;
  customer: { name: string; phone?: string } | null;
  right_eye_sphere: number | null;
  right_eye_cylinder: number | null;
  right_eye_axis: number | null;
  right_eye_add: number | null;
  left_eye_sphere: number | null;
  left_eye_cylinder: number | null;
  left_eye_axis: number | null;
  left_eye_add: number | null;
  pd_distance: number | null;
  notes: string | null;
}

interface PrescriptionReceiptProps {
  prescription: Prescription;
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopEmail?: string;
}

const formatValue = (value: number | null, suffix = "") => {
  if (value === null || value === undefined) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}${suffix}`;
};

const PrescriptionReceipt = forwardRef<HTMLDivElement, PrescriptionReceiptProps>(
  ({ prescription, shopName = "Naeem Optics", shopAddress = "123 Main Street", shopPhone = "+92 300 1234567", shopEmail = "info@naeemoptics.com" }, ref) => {
    // Guard against invalid prescription data
    if (!prescription?.prescription_date) {
      return <div ref={ref} />;
    }

    return (
      <div ref={ref} className="bg-white text-black p-6 w-[100mm] mx-auto font-mono text-xs print:w-full print:max-w-[100mm]">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-lg font-bold uppercase tracking-wide">{shopName}</h1>
          <p className="text-[10px] mt-1">{shopAddress}</p>
          <p className="text-[10px]">Tel: {shopPhone}</p>
          <p className="text-[10px]">{shopEmail}</p>
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-base font-bold uppercase border border-black py-1">
            Eye Prescription
          </h2>
        </div>

        {/* Patient Info */}
        <div className="border-b border-dashed border-gray-400 pb-3 mb-4">
          <div className="flex justify-between mb-1">
            <span className="font-semibold">Patient Name:</span>
            <span>{prescription.customer?.name || "N/A"}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-semibold">Phone:</span>
            <span>{prescription.customer?.phone || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Date:</span>
            <span>{format(new Date(prescription.prescription_date), "dd/MM/yyyy")}</span>
          </div>
        </div>

        {/* Prescription Table */}
        <div className="mb-4">
          <table className="w-full border-collapse border border-black text-center">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black py-2 px-1"></th>
                <th className="border border-black py-2 px-1">SPH</th>
                <th className="border border-black py-2 px-1">CYL</th>
                <th className="border border-black py-2 px-1">AXIS</th>
                <th className="border border-black py-2 px-1">ADD</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black py-2 px-1 font-bold bg-gray-50">OD (R)</td>
                <td className="border border-black py-2 px-1">{formatValue(prescription.right_eye_sphere)}</td>
                <td className="border border-black py-2 px-1">{formatValue(prescription.right_eye_cylinder)}</td>
                <td className="border border-black py-2 px-1">{prescription.right_eye_axis !== null ? `${prescription.right_eye_axis}°` : "-"}</td>
                <td className="border border-black py-2 px-1">{formatValue(prescription.right_eye_add)}</td>
              </tr>
              <tr>
                <td className="border border-black py-2 px-1 font-bold bg-gray-50">OS (L)</td>
                <td className="border border-black py-2 px-1">{formatValue(prescription.left_eye_sphere)}</td>
                <td className="border border-black py-2 px-1">{formatValue(prescription.left_eye_cylinder)}</td>
                <td className="border border-black py-2 px-1">{prescription.left_eye_axis !== null ? `${prescription.left_eye_axis}°` : "-"}</td>
                <td className="border border-black py-2 px-1">{formatValue(prescription.left_eye_add)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* PD */}
        <div className="border border-black p-2 mb-4 text-center">
          <span className="font-bold">Pupillary Distance (PD): </span>
          <span>{prescription.pd_distance !== null ? `${prescription.pd_distance} mm` : "N/A"}</span>
        </div>

        {/* Notes */}
        {prescription.notes && (
          <div className="border-b border-dashed border-gray-400 pb-3 mb-4">
            <p className="font-semibold mb-1">Notes:</p>
            <p className="text-[10px]">{prescription.notes}</p>
          </div>
        )}

        {/* Legend */}
        <div className="text-[9px] text-gray-600 mb-4">
          <p><strong>OD:</strong> Right Eye | <strong>OS:</strong> Left Eye</p>
          <p><strong>SPH:</strong> Sphere | <strong>CYL:</strong> Cylinder | <strong>ADD:</strong> Addition</p>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] border-t border-gray-400 pt-3">
          <p className="font-semibold">Thank you for choosing {shopName}!</p>
          <p className="mt-1">This prescription is valid for one year from date of issue.</p>
          <div className="mt-3 pt-2 border-t border-gray-300">
            <p className="text-[9px] text-gray-500">
              Printed: {format(new Date(), "dd/MM/yyyy HH:mm:ss")}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

PrescriptionReceipt.displayName = "PrescriptionReceipt";

export default PrescriptionReceipt;
