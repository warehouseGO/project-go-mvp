import React from "react";

const AttributesModal = ({ isOpen, onClose, attributes }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw]">
        <h2 className="text-lg font-semibold mb-4">Device Attributes</h2>
        {attributes && typeof attributes === "object" ? (
          <table className="min-w-full text-sm">
            <tbody>
              {Object.entries(attributes).map(([key, value]) => (
                <tr key={key}>
                  <td className="font-medium pr-4 py-1 text-gray-700">{key}</td>
                  <td className="py-1 text-gray-900">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-gray-500">No attributes found.</div>
        )}
        <div className="mt-6 text-right">
          <button className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttributesModal;
