"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, X, Save } from "lucide-react";
import EthiopianDatePicker from "./EthiopianDatePicker";

interface Props {
  type: "misbak" | "minbabat";
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

interface MisbakItem {
  id: number;
  date: string;
  dayOfWeek: string;
  geez: string;
  translation: string;
  liturgy: string;
}

interface MinbabatItem {
  day: string;
  category: string;
  title: string;
  content: string;
}

export default function ContentManagement({
  type,
  isSuperAdmin,
  isAdmin,
}: Props) {
  const [misbakData, setMisbakData] = useState<MisbakItem[]>([]);
  const [minbabatData, setMinbabatData] = useState<any>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [selectedMonth, setSelectedMonth] = useState<string>("መስከረም");

  // Ethiopian months
  const ethiopianMonths = [
    "መስከረም", "ጥቅምት", "ኅዳር", "ታኅሣሥ", "ጥር", "የካቲት",
    "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"
  ];

  useEffect(() => {
    loadData();
  }, [type]);

  const loadData = async () => {
    try {
      if (type === "misbak") {
        const response = await fetch("/api/admin/misbak");
        const data = await response.json();
        setMisbakData(data);
      } else {
        const response = await fetch("/api/admin/minbabat");
        const data = await response.json();

        // Flatten Month -> Array structure to Day -> Categories
        const flattened: any = {};
        if (data && typeof data === "object") {
          Object.values(data).forEach((days: any) => {
            if (Array.isArray(days)) {
              days.forEach((dayObj: any) => {
                const { date, id, ...categories } = dayObj;
                if (date) {
                  flattened[date] = categories;
                }
              });
            }
          });
        }
        setMinbabatData(flattened);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const canEdit = isSuperAdmin || isAdmin;

  const saveMisbakData = async (data: MisbakItem[]) => {
    try {
      const response = await fetch("/api/admin/misbak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        throw new Error("Failed to save misbak data");
      }

      console.log("Misbak data saved successfully");
    } catch (error) {
      console.error("Error saving misbak data:", error);
      alert("Failed to save data. Please try again.");
    }
  };

  const saveMinbabatData = async (data: any) => {
    try {
      const response = await fetch("/api/admin/minbabat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        throw new Error("Failed to save minbabat data");
      }

      console.log("Minbabat data saved successfully");
    } catch (error) {
      console.error("Error saving minbabat data:", error);
      alert("Failed to save data. Please try again.");
    }
  };

  const handleAdd = async () => {
    if (type === "misbak") {
      const newItem: MisbakItem = {
        id: Date.now(),
        date: formData.date || "",
        dayOfWeek: formData.dayOfWeek || "",
        geez: formData.geez || "",
        translation: formData.translation || "",
        liturgy: formData.liturgy || "",
      };
      const updatedData = [...misbakData, newItem];
      setMisbakData(updatedData);
      await saveMisbakData(updatedData);
    } else if (type === "minbabat") {
      const day = formData.date;
      const category = formData.category;

      if (day && category) {
        const updated = { ...minbabatData };
        if (!updated[day]) {
          updated[day] = {};
        }
        updated[day][category] = {
          title: formData.title || "",
          content: formData.content || "",
        };
        setMinbabatData(updated);
        await saveMinbabatData(updated);
      }
    }
    setShowAddModal(false);
    resetForm();
  };

  const handleEdit = async () => {
    if (type === "misbak" && selectedItem) {
      const updated = misbakData.map((item) =>
        item.id === selectedItem.id ? { ...item, ...formData } : item,
      );
      setMisbakData(updated);
      await saveMisbakData(updated);
    } else if (type === "minbabat" && selectedItem) {
      const updated = { ...minbabatData };
      const day = selectedItem.day;
      const category = selectedItem.category;

      if (updated[day] && updated[day][category]) {
        updated[day][category] = {
          title: formData.title || "",
          content: formData.content || "",
        };
        setMinbabatData(updated);
        await saveMinbabatData(updated);
      }
    }
    setShowEditModal(false);
    setShowDetailView(false);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      const updatedData = misbakData.filter((item) => item.id !== id);
      setMisbakData(updatedData);
      await saveMisbakData(updatedData);
      setShowDetailView(false);
    }
  };

  const resetForm = () => {
    setFormData({});
    setSelectedItem(null);
  };

  const openDetailView = (item: any) => {
    setSelectedItem(item);
    setShowDetailView(true);
  };

  const openEditModalFromDetail = () => {
    setFormData(selectedItem);
    setShowDetailView(false);
    setShowEditModal(true);
  };

  const openEditModal = (item: any) => {
    setSelectedItem(item);
    setFormData(item);
    setShowEditModal(true);
  };

  // Group data by month
  const groupByMonth = (data: MisbakItem[]) => {
    const grouped: { [key: string]: MisbakItem[] } = {};
    data.forEach((item) => {
      const month = item.date.split(" ")[0];
      if (!grouped[month]) {
        grouped[month] = [];
      }
      grouped[month].push(item);
    });
    return grouped;
  };

  const groupedMisbakData = type === "misbak" ? groupByMonth(misbakData) : {};

  // Group minbabat by month
  const groupMinbabatByMonth = () => {
    const grouped: { [key: string]: any } = {};
    Object.entries(minbabatData).forEach(([date, categories]) => {
      const month = date.split(" ")[0];
      if (!grouped[month]) {
        grouped[month] = {};
      }
      grouped[month][date] = categories;
    });
    return grouped;
  };

  const groupedMinbabatData = type === "minbabat" ? groupMinbabatByMonth() : {};

  // Get days for calendar
  const getDaysInMonth = (month: string) => {
    return month === "ጳጉሜ" ? 6 : 30;
  };

  // Find data for a specific day
  const getDataForDay = (month: string, day: number) => {
    if (type === "misbak") {
      return groupedMisbakData[month]?.find(item => {
        const dayNum = parseInt(item.date.split(" ")[1]);
        return dayNum === day;
      });
    } else {
      const dateKey = `${month} ${day}`;
      return groupedMinbabatData[month]?.[dateKey] ? { date: dateKey, ...groupedMinbabatData[month][dateKey] } : null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {type === "misbak" ? "ምስባክ Management" : "ምንባባት Management"}
          </h2>
          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
          )}
        </div>

        {/* Month Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {ethiopianMonths.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${selectedMonth === month
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {month}
            </button>
          ))}
        </div>
      </div>

      {/* Content List - Calendar Grid for both types */}
      <div className="space-y-4">
        {/* Month Header */}
        <div className={`bg-gradient-to-r rounded-lg shadow-lg p-4 text-white ${type === "misbak" ? "from-blue-600 to-blue-700" : "from-green-600 to-green-700"
          }`}>
          <h3 className="text-xl font-bold">{selectedMonth}</h3>
          <p className="text-sm opacity-90">
            {type === "misbak"
              ? `${groupedMisbakData[selectedMonth]?.length || 0} / ${getDaysInMonth(selectedMonth)} days`
              : `${Object.keys(groupedMinbabatData[selectedMonth] || {}).length} / ${getDaysInMonth(selectedMonth)} days`
            }
          </p>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-7 gap-2">
            {/* Day Labels */}
            {["እሁድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ"].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-700 py-2 text-sm">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {Array.from({ length: getDaysInMonth(selectedMonth) }, (_, i) => i + 1).map((day) => {
              const dayData = getDataForDay(selectedMonth, day);
              const hasData = !!dayData;

              return (
                <button
                  key={day}
                  onClick={() => dayData && openDetailView(dayData)}
                  className={`aspect-square rounded-lg p-2 text-center transition-all ${hasData
                    ? type === "misbak"
                      ? "bg-blue-100 hover:bg-blue-200 border-2 border-blue-400 cursor-pointer"
                      : "bg-green-100 hover:bg-green-200 border-2 border-green-400 cursor-pointer"
                    : "bg-gray-50 border border-gray-200 cursor-default"
                    }`}
                >
                  <div className="font-bold text-gray-900">{day}</div>
                  {hasData && (
                    <div className="mt-1">
                      <div className={`w-2 h-2 rounded-full mx-auto ${type === "misbak" ? "bg-blue-600" : "bg-green-600"
                        }`}></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Detail - Misbak */}
        {selectedItem && showDetailView && type === "misbak" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-blue-700">
                  {selectedItem.date}
                </h3>
                <p className="text-sm text-gray-600">{selectedItem.dayOfWeek}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDetailView(false)}
                  className="text-gray-600 hover:text-gray-700 p-2"
                >
                  <X className="w-5 h-5" />
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => handleDelete(selectedItem.id)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">ግዕዝ፡-</p>
                <p className="text-gray-800 whitespace-pre-wrap">{selectedItem.geez}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-600 mb-2">ትርጉም፡-</p>
                <p className="text-gray-800 whitespace-pre-wrap">{selectedItem.translation}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-gray-800 font-medium text-center">{selectedItem.liturgy}</p>
              </div>
              {canEdit && (
                <button
                  onClick={openEditModalFromDetail}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Edit className="w-5 h-5" />
                  Edit This Day
                </button>
              )}
            </div>
          </div>
        )}

        {/* Selected Day Detail - Minbabat */}
        {selectedItem && showDetailView && type === "minbabat" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-green-700">{selectedItem.date}</h3>
              <button
                onClick={() => setShowDetailView(false)}
                className="text-gray-600 hover:text-gray-700 p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {Object.entries(selectedItem).map(([key, value]: [string, any]) => {
                if (key === "date") return null;
                return (
                  <div key={key} className="border-l-4 border-green-500 pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{key}</p>
                        <p className="text-sm text-gray-600">{value?.title || "No title"}</p>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => openEditModal({ day: selectedItem.date, category: key, ...value })}
                          className="text-blue-600 hover:text-blue-700 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{value?.content || "No content"}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal - Misbak */}
      {(showAddModal || showEditModal) && type === "misbak" && !showDetailView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {showAddModal ? "Add New Misbak" : "Edit Misbak"}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {showAddModal && (
                <>
                  <EthiopianDatePicker
                    selectedDate={formData.date || ""}
                    onDateSelect={(date, dayOfWeek) => {
                      setFormData({
                        ...formData,
                        date: date,
                        dayOfWeek: dayOfWeek,
                      });
                    }}
                  />
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <strong>Selected:</strong> {formData.date || "Not selected"}
                    </p>
                  </div>
                </>
              )}
              {showEditModal && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    <strong>Editing:</strong> {selectedItem?.date}
                  </p>
                </div>
              )}
              <textarea
                placeholder="Geez Text"
                value={formData.geez || ""}
                onChange={(e) =>
                  setFormData({ ...formData, geez: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg h-24 text-gray-900"
              />
              <textarea
                placeholder="Translation"
                value={formData.translation || ""}
                onChange={(e) =>
                  setFormData({ ...formData, translation: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg h-24 text-gray-900"
              />
              <input
                type="text"
                placeholder="Liturgy (e.g., ቅዳሴ፦ ዘዲዮስቆሮስ)"
                value={formData.liturgy || ""}
                onChange={(e) =>
                  setFormData({ ...formData, liturgy: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg text-gray-900"
              />
              <button
                onClick={showAddModal ? handleAdd : handleEdit}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {showAddModal ? "Add" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal - Minbabat */}
      {(showAddModal || showEditModal) && type === "minbabat" && !showDetailView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {showAddModal ? "Add New Reading" : "Edit Reading"}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {showAddModal && (
                <>
                  <EthiopianDatePicker
                    selectedDate={formData.date || ""}
                    onDateSelect={(date, dayOfWeek) => {
                      setFormData({
                        ...formData,
                        date: date,
                        dayOfWeek: dayOfWeek,
                      });
                    }}
                  />
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <strong>Selected:</strong> {formData.date || "Not selected"}
                    </p>
                  </div>
                  <select
                    value={formData.category || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg text-gray-900"
                  >
                    <option value="">Select Category</option>
                    <option value="የቅዱስ ጳውሎስ መልዕክት">የቅዱስ ጳውሎስ መልዕክት</option>
                    <option value="መልዕክታት">መልዕክታት</option>
                    <option value="የሐዋሪያት ስራ">የሐዋሪያት ስራ</option>
                    <option value="ወንጌል">ወንጌል</option>
                  </select>
                </>
              )}
              {showEditModal && (
                <div className="bg-gray-50 border rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    <strong>Day:</strong> {selectedItem?.day}
                    <br />
                    <strong>Category:</strong> {selectedItem?.category}
                  </p>
                </div>
              )}
              <input
                type="text"
                placeholder="Title (e.g., ሮሜ 8:1-17)"
                value={formData.title || ""}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg text-gray-900"
              />
              <textarea
                placeholder="Content"
                value={formData.content || ""}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg h-32 text-gray-900"
              />
              <button
                onClick={showAddModal ? handleAdd : handleEdit}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {showAddModal ? "Add" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Permissions:</strong>{" "}
          {isSuperAdmin
            ? "You can add, edit, and delete content."
            : isAdmin
              ? "You can add and edit content."
              : "You can only view content."}
        </p>
      </div>
    </div>
  );
}
