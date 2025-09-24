import React, { useEffect, useState } from "react";
import { manpowerAPI } from "../../utils/api";

const formatYmd = (d) => new Date(d).toISOString().split("T")[0];

const ManpowerSafetyTBTModal = ({ isOpen, onClose, siteId, defaultDate }) => {
  const [date, setDate] = useState(defaultDate || formatYmd(new Date()));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [safety, setSafety] = useState({
    nearmiss: 0,
    firstaid: 0,
    lti: 0,
    fireincidents: 0,
    auditsConducted: 0,
    incidentReport: 0,
  });

  const [tbt, setTbt] = useState({
    specificPPE: "",
    housekeeping: "",
    plantEquipmentSafety: "",
    workingUnderSuspendedLoad: "",
    importantOfEyeShower: "",
  });

  const fetchData = async (d) => {
    try {
      setLoading(true);
      const params = { date: d };
      const [sRes, tRes] = await Promise.all([
        manpowerAPI.getSafety(siteId, params),
        manpowerAPI.getTBT(siteId, params),
      ]);
      if (sRes.data)
        setSafety({
          nearmiss: sRes.data.nearmiss ?? 0,
          firstaid: sRes.data.firstaid ?? 0,
          lti: sRes.data.lti ?? 0,
          fireincidents: sRes.data.fireincidents ?? 0,
          auditsConducted: sRes.data.auditsConducted ?? 0,
          incidentReport: sRes.data.incidentReport ?? 0,
        });
      if (tRes.data)
        setTbt({
          specificPPE: tRes.data.specificPPE ?? "",
          housekeeping: tRes.data.housekeeping ?? "",
          plantEquipmentSafety: tRes.data.plantEquipmentSafety ?? "",
          workingUnderSuspendedLoad: tRes.data.workingUnderSuspendedLoad ?? "",
          importantOfEyeShower: tRes.data.importantOfEyeShower ?? "",
        });
    } catch (e) {
      // ignore missing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && siteId) fetchData(date);
  }, [isOpen, siteId, date]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await Promise.all([
        manpowerAPI.upsertSafety(siteId, { date, ...safety }),
        manpowerAPI.upsertTBT(siteId, { date, ...tbt }),
      ]);
      onClose(true);
    } catch (e) {
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 overflow-y-auto">
      <div className="min-h-full flex items-start justify-center p-4">
        <div className="bg-white w-full max-w-3xl rounded-lg shadow p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Safety & TBT Entry</h3>
            <button
              onClick={() => onClose(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                className="input-field"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Safety */}
            <div>
              <h4 className="font-medium mb-3">Safety</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Near Miss", "nearmiss"],
                  ["First Aid", "firstaid"],
                  ["LTI", "lti"],
                  ["Fire Incidents", "fireincidents"],
                  ["Audits Conducted", "auditsConducted"],
                  ["Incident Reports", "incidentReport"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-600 mb-1">
                      {label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="input-field"
                      value={safety[key]}
                      onChange={(e) =>
                        setSafety({
                          ...safety,
                          [key]: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* TBT */}
            <div>
              <h4 className="font-medium mb-3">TBT Topics/Observations</h4>
              {[
                ["Specific PPE", "specificPPE"],
                ["Housekeeping", "housekeeping"],
                ["Plant Equipment Safety", "plantEquipmentSafety"],
                ["Working Under Suspended Load", "workingUnderSuspendedLoad"],
                ["Importance of Eye Shower", "importantOfEyeShower"],
              ].map(([label, key]) => (
                <div className="mb-3" key={key}>
                  <label className="block text-xs text-gray-600 mb-1">
                    {label}
                  </label>
                  <textarea
                    className="input-field"
                    rows={2}
                    value={tbt[key]}
                    onChange={(e) => setTbt({ ...tbt, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button className="btn-secondary" onClick={() => onClose(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || loading}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManpowerSafetyTBTModal;
