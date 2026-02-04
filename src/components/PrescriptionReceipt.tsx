import { forwardRef } from "react";
import { format } from "date-fns";

interface Prescription {
  id: string;
  prescription_date: string;
  age: number | null;
  customer: { name: string; phone?: string } | null;
  // D.V. Right Eye
  right_eye_sphere: number | null;
  right_eye_cylinder: number | null;
  right_eye_axis: number | null;
  right_eye_va: string | null;
  // D.V. Left Eye
  left_eye_sphere: number | null;
  left_eye_cylinder: number | null;
  left_eye_axis: number | null;
  left_eye_va: string | null;
  // N.V. Right Eye
  right_eye_nv_sphere: number | null;
  right_eye_nv_cylinder: number | null;
  right_eye_nv_axis: number | null;
  right_eye_nv_va: string | null;
  // N.V. Left Eye
  left_eye_nv_sphere: number | null;
  left_eye_nv_cylinder: number | null;
  left_eye_nv_axis: number | null;
  left_eye_nv_va: string | null;
  // Legacy fields (for backward compatibility)
  right_eye_add: number | null;
  left_eye_add: number | null;
  // New Addition field
  addition: number | null;
  // Lens Options
  emr_coating: boolean;
  blue_cut: boolean;
  plastic: boolean;
  tint: boolean;
  anti_glare: boolean;
  polycarbonate: boolean;
  bifocal: boolean;
  progressive: boolean;
  // Other
  pd_distance: number | null;
  notes: string | null;
}

interface PrescriptionReceiptProps {
  prescription: Prescription;
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopEmail?: string;
  serialNumber?: string;
}

const formatValue = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
};

const formatAxis = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "";
  return `${value}°`;
};

const PrintCheckbox = ({ label, checked = false }: { label: string; checked?: boolean }) => (
  <div className="flex items-center gap-1.5 text-[10px]">
    <div className="w-3 h-3 border border-black flex items-center justify-center">
      {checked && <span className="text-[8px] font-bold">✓</span>}
    </div>
    <span>{label}</span>
  </div>
);

const PrescriptionReceipt = forwardRef<HTMLDivElement, PrescriptionReceiptProps>(
  ({ prescription, shopName = "Naeem Optics", shopAddress = "Circular-Road, Sheranwala Gate, Near Allied Bank", shopPhone = "+92 300 9839515", shopEmail = "saadk2953@gmail.com", serialNumber }, ref) => {
    // Guard against invalid prescription data
    if (!prescription?.prescription_date) {
      return <div ref={ref} />;
    }

    // Check if NV section should be hidden (when Addition has value but NV fields are empty)
    const hasAddition = prescription.addition !== null && prescription.addition !== undefined;
    const hasNvData = (
      prescription.right_eye_nv_sphere !== null ||
      prescription.right_eye_nv_cylinder !== null ||
      prescription.right_eye_nv_axis !== null ||
      prescription.right_eye_nv_va !== null ||
      prescription.left_eye_nv_sphere !== null ||
      prescription.left_eye_nv_cylinder !== null ||
      prescription.left_eye_nv_axis !== null ||
      prescription.left_eye_nv_va !== null ||
      prescription.right_eye_add !== null ||
      prescription.left_eye_add !== null
    );
    const showNvSection = !hasAddition || hasNvData;

    const prescriptionDate = format(new Date(prescription.prescription_date), "dd/MM/yyyy");
    const sNo = serialNumber || prescription.id?.slice(0, 6).toUpperCase() || "";

    // For N.V. section, use dedicated NV fields or fall back to legacy "add" fields
    const rightNvSphere = prescription.right_eye_nv_sphere ?? prescription.right_eye_add;
    const leftNvSphere = prescription.left_eye_nv_sphere ?? prescription.left_eye_add;

    return (
      <div ref={ref} className="bg-white text-black p-6 w-[210mm] mx-auto font-sans text-xs print:w-full print:max-w-[210mm]">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <h1 className="text-xl font-bold uppercase tracking-wide">{shopName}</h1>
          <p className="text-[10px] mt-1">{shopAddress}</p>
          <p className="text-[10px]">Tel: {shopPhone} | Email: {shopEmail}</p>
        </div>

        {/* Patient Info Row */}
        <div className="flex justify-between mb-4 text-[11px]">
          <div className="flex-1">
            <span className="font-semibold">Patient Name: </span>
            <span className="border-b border-black inline-block min-w-[150px]">
              {prescription.customer?.name || ""}
            </span>
          </div>
        </div>

        <div className="flex justify-between mb-4 text-[11px] gap-4">
          <div className="flex items-center">
            <span className="font-semibold">Age: </span>
            <span className="border-b border-black inline-block min-w-[60px] ml-1">
              {prescription.age ? `${prescription.age} years` : "______"}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">Date: </span>
            <span className="border-b border-black inline-block min-w-[80px] ml-1">{prescriptionDate}</span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">S.No. </span>
            <span className="border-b border-black inline-block min-w-[60px] ml-1">{sNo}</span>
          </div>
          {prescription.addition && (
            <div className="flex items-center">
              <span className="font-semibold">ADD: </span>
              <span className="border-b border-black inline-block min-w-[50px] ml-1 font-bold">{formatValue(prescription.addition)}</span>
            </div>
          )}
        </div>

        {/* D.V. Section - Distance Vision */}
        <div className="mb-4">
          <h3 className="text-center font-bold text-sm mb-2 underline">D.V.</h3>
          <div className="flex gap-4">
            {/* D.V. Table */}
            <table className="flex-1 border-collapse border border-black text-center text-[10px]">
              <thead>
                <tr>
                  <th className="border border-black py-1.5 px-2 w-12"></th>
                  <th className="border border-black py-1.5 px-2">Spherical</th>
                  <th className="border border-black py-1.5 px-2">Cylindrical</th>
                  <th className="border border-black py-1.5 px-2">Axis</th>
                  <th className="border border-black py-1.5 px-2">VA</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black py-3 px-2 font-bold">OD</td>
                  <td className="border border-black py-3 px-2">{formatValue(prescription.right_eye_sphere)}</td>
                  <td className="border border-black py-3 px-2">{formatValue(prescription.right_eye_cylinder)}</td>
                  <td className="border border-black py-3 px-2">{formatAxis(prescription.right_eye_axis)}</td>
                  <td className="border border-black py-3 px-2">{prescription.right_eye_va || ""}</td>
                </tr>
                <tr>
                  <td className="border border-black py-3 px-2 font-bold">OS</td>
                  <td className="border border-black py-3 px-2">{formatValue(prescription.left_eye_sphere)}</td>
                  <td className="border border-black py-3 px-2">{formatValue(prescription.left_eye_cylinder)}</td>
                  <td className="border border-black py-3 px-2">{formatAxis(prescription.left_eye_axis)}</td>
                  <td className="border border-black py-3 px-2">{prescription.left_eye_va || ""}</td>
                </tr>
              </tbody>
            </table>

            {/* Lens Options Checkboxes */}
            <div className="flex flex-col justify-center gap-1 min-w-[100px]">
              <PrintCheckbox label="EMR Coating" checked={prescription.emr_coating} />
              <PrintCheckbox label="Blue Cut" checked={prescription.blue_cut} />
              <PrintCheckbox label="Plastic" checked={prescription.plastic} />
              <PrintCheckbox label="Tint" checked={prescription.tint} />
              <PrintCheckbox label="Anti-Glare" checked={prescription.anti_glare} />
              <PrintCheckbox label="Polycarbonate" checked={prescription.polycarbonate} />
            </div>
          </div>
        </div>

        {/* N.V. Section - Near Vision (conditionally shown) */}
        {showNvSection && (
          <div className="mb-4">
            <h3 className="text-center font-bold text-sm mb-2 underline">N.V.</h3>
            <div className="flex gap-4">
              {/* N.V. Table */}
              <table className="flex-1 border-collapse border border-black text-center text-[10px]">
                <thead>
                  <tr>
                    <th className="border border-black py-1.5 px-2 w-12"></th>
                    <th className="border border-black py-1.5 px-2">Spherical</th>
                    <th className="border border-black py-1.5 px-2">Cylindrical</th>
                    <th className="border border-black py-1.5 px-2">Axis</th>
                    <th className="border border-black py-1.5 px-2">VA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black py-3 px-2 font-bold">OD</td>
                    <td className="border border-black py-3 px-2">{formatValue(rightNvSphere)}</td>
                    <td className="border border-black py-3 px-2">{formatValue(prescription.right_eye_nv_cylinder)}</td>
                    <td className="border border-black py-3 px-2">{formatAxis(prescription.right_eye_nv_axis)}</td>
                    <td className="border border-black py-3 px-2">{prescription.right_eye_nv_va || ""}</td>
                  </tr>
                  <tr>
                    <td className="border border-black py-3 px-2 font-bold">OS</td>
                    <td className="border border-black py-3 px-2">{formatValue(leftNvSphere)}</td>
                    <td className="border border-black py-3 px-2">{formatValue(prescription.left_eye_nv_cylinder)}</td>
                    <td className="border border-black py-3 px-2">{formatAxis(prescription.left_eye_nv_axis)}</td>
                    <td className="border border-black py-3 px-2">{prescription.left_eye_nv_va || ""}</td>
                  </tr>
                </tbody>
              </table>

              {/* NV Options */}
              <div className="flex flex-col justify-center gap-2 min-w-[100px]">
                <PrintCheckbox label="Bifocal" checked={prescription.bifocal} />
                <PrintCheckbox label="Progressive" checked={prescription.progressive} />
                <div className="flex items-center gap-1 text-[10px] mt-2">
                  <span className="font-semibold">IPD.</span>
                  <span className="border-b border-black inline-block min-w-[40px]">
                    {prescription.pd_distance || ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* IPD and Lens Options when NV is hidden */}
        {!showNvSection && (
          <div className="mb-4 flex gap-4">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-semibold">IPD:</span>
              <span className="border-b border-black inline-block min-w-[50px]">
                {prescription.pd_distance || ""}
              </span>
            </div>
            <div className="flex gap-3">
              <PrintCheckbox label="Bifocal" checked={prescription.bifocal} />
              <PrintCheckbox label="Progressive" checked={prescription.progressive} />
            </div>
          </div>
        )}

        {/* Remarks */}
        <div className="mb-6">
          <div className="flex items-start text-[11px]">
            <span className="font-semibold">Remarks:</span>
            <span className="border-b border-black inline-block flex-1 ml-2 min-h-[20px]">
              {prescription.notes || ""}
            </span>
          </div>
        </div>

        {/* Sign/Stamp */}
        <div className="flex justify-end mb-6">
          <div className="text-right text-[11px]">
            <div className="border-b border-black min-w-[150px] h-[40px]"></div>
            <span className="font-semibold">Sign/Stamp:</span>
          </div>
        </div>

        {/* Footer Quote */}
        <div className="text-center border-t border-black pt-3">
          <p className="italic text-[11px]">"Get your eyes checked every 6 Months - keep them healthy"</p>
        </div>

        {/* Legend - small print */}
        <div className="text-[8px] text-gray-500 mt-3 text-center">
          <p><strong>OD:</strong> Right Eye (Oculus Dexter) | <strong>OS:</strong> Left Eye (Oculus Sinister) | <strong>D.V.:</strong> Distance Vision | <strong>N.V.:</strong> Near Vision | <strong>IPD:</strong> Interpupillary Distance</p>
        </div>
      </div>
    );
  }
);

PrescriptionReceipt.displayName = "PrescriptionReceipt";

export default PrescriptionReceipt;
