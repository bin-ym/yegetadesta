"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, X, Save, CheckCircle, AlertCircle, Calendar } from "lucide-react";
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

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
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
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Step-through add state for minbabat
  const [addedCategories, setAddedCategories] = useState<string[]>([]);
  // Edit-all state for minbabat
  const [showEditAllModal, setShowEditAllModal] = useState(false);
  const [editAllData, setEditAllData] = useState<{ [category: string]: { title: string; content: string } }>({});

  // The four minbabat categories in order
  const minbabatCategories = [
    "የቅዱስ ጳውሎስ መልዕክት",
    "መልዕክታት",
    "የሐዋሪያት ስራ",
    "ወንጌል",
  ];

  const showToast = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

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

        // API already returns { "date": { "category": { title, content } } }
        // Use it directly
        if (data && typeof data === "object" && !Array.isArray(data)) {
          setMinbabatData(data);
        } else {
          setMinbabatData({});
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const canEdit = isSuperAdmin || isAdmin;

  // Validate form data
  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (type === "misbak") {
      if (showAddModal && !formData.date) {
        errors.push("Date is required");
      }
      if (!formData.geez && !formData.translation) {
        errors.push("At least one of Geez text or Translation is required");
      }
    } else {
      if (showAddModal && !formData.date) {
        errors.push("Date is required");
      }
      if (showAddModal && !formData.category) {
        errors.push("Category is required");
      }
      if (!formData.title && !formData.content) {
        errors.push("At least one of Title or Content is required");
      }
    }
    return errors;
  };

  // Add single misbak entry via PUT
  const addMisbakEntry = async (item: MisbakItem) => {
    try {
      const response = await fetch("/api/admin/misbak", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to add entry");
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error adding misbak entry:", error);
      throw error;
    }
  };

  // Update single misbak entry via PATCH
  const updateMisbakEntry = async (id: number, data: Partial<MisbakItem>) => {
    try {
      const response = await fetch("/api/admin/misbak", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update entry");
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error updating misbak entry:", error);
      throw error;
    }
  };

  // Add/update single minbabat entry via PATCH (upsert)
  const saveMinbabatEntry = async (date: string, category: string, title: string, content: string) => {
    try {
      const response = await fetch("/api/admin/minbabat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, category, title, content }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save entry");
      }
      return true;
    } catch (error) {
      console.error("Error saving minbabat entry:", error);
      throw error;
    }
  };

  // Delete misbak entry
  const deleteMisbakEntry = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/misbak?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to delete entry");
      }
      return true;
    } catch (error) {
      console.error("Error deleting misbak entry:", error);
      throw error;
    }
  };

  const handleAdd = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    setSaving(true);

    try {
      if (type === "misbak") {
        const newItem = await addMisbakEntry({
          id: 0,
          date: formData.date || "",
          dayOfWeek: formData.dayOfWeek || "",
          geez: formData.geez || "",
          translation: formData.translation || "",
          liturgy: formData.liturgy || "",
        });
        setMisbakData((prev) => [...prev, newItem]);
        showToast("success", "Misbak entry added successfully");
      } else if (type === "minbabat") {
        const day = formData.date;
        const category = formData.category;
        if (day && category) {
          await saveMinbabatEntry(
            day,
            category,
            formData.title || "",
            formData.content || "",
          );
          const updated = { ...minbabatData };
          if (!updated[day]) {
            updated[day] = {};
          }
          updated[day][category] = {
            title: formData.title || "",
            content: formData.content || "",
          };
          setMinbabatData(updated);

          // Track added category, let user freely pick the next one
          const newAdded = [...addedCategories, category];
          setAddedCategories(newAdded);

          // Check if all categories are done
          const allDone = minbabatCategories.every(c => newAdded.includes(c));

          if (allDone) {
            showToast("success", "All 4 categories added for this day!");
            setShowAddModal(false);
            resetForm();
          } else {
            // Reset title/content, let user pick any remaining category
            setFormData({ ...formData, title: "", content: "" });
            setValidationErrors([]);
            showToast("success", `"${category}" added!`);
          }
        }
      }
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Failed to save data");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    setSaving(true);

    try {
      if (type === "misbak" && selectedItem) {
        const updated = await updateMisbakEntry(selectedItem.id, formData);
        setMisbakData((prev) =>
          prev.map((item) => (item.id === selectedItem.id ? updated : item)),
        );
        showToast("success", "Misbak entry updated successfully");
      } else if (type === "minbabat" && selectedItem) {
        const day = selectedItem.day;
        const category = selectedItem.category;
        await saveMinbabatEntry(
          day,
          category,
          formData.title || "",
          formData.content || "",
        );
        const updated = { ...minbabatData };
        if (updated[day] && updated[day][category]) {
          updated[day][category] = {
            title: formData.title || "",
            content: formData.content || "",
          };
          setMinbabatData(updated);
        }
        showToast("success", "Minbabat entry updated successfully");
      }
      setShowEditModal(false);
      setShowDetailView(false);
      resetForm();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Failed to update data");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setSaving(true);

    try {
      await deleteMisbakEntry(id);
      setMisbakData((prev) => prev.filter((item) => item.id !== id));
      setShowDetailView(false);
      showToast("success", "Entry deleted successfully");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Failed to delete entry");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({});
    setSelectedItem(null);
    setValidationErrors([]);
    setAddedCategories([]);
  };

  const handleFinishAdd = () => {
    setShowAddModal(false);
    resetForm();
  };

  // Save all categories from the Edit All modal
  const handleEditAllSave = async () => {
    if (!selectedItem?.date) return;
    setSaving(true);
    try {
      const day = selectedItem.date;
      for (const category of minbabatCategories) {
        const data = editAllData[category];
        // Skip empty categories (API requires at least one of title or content)
        if (data?.title || data?.content) {
          await saveMinbabatEntry(day, category, data.title || "", data.content || "");
        }
      }
      // Refresh local data
      const updated = { ...minbabatData };
      if (!updated[day]) updated[day] = {};
      for (const category of minbabatCategories) {
        const data = editAllData[category];
        if (data?.title || data?.content) {
          updated[day][category] = {
            title: data.title || "",
            content: data.content || "",
          };
        }
      }
      setMinbabatData(updated);
      // Update the detail view
      setSelectedItem({ date: day, ...updated[day] });
      setShowEditAllModal(false);
      showToast("success", "All categories saved successfully!");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
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
      // Match date keys that include the year (e.g., "ሐምሌ 8 2018")
      const datePrefix = `${month} ${day}`;
      const dates = groupedMinbabatData[month] || {};
      const matchedKey = Object.keys(dates).find(key => key.startsWith(datePrefix));
      if (matchedKey) {
        return { date: matchedKey, ...dates[matchedKey] };
      }
      return null;
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
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {ethiopianMonths.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap font-medium transition-all duration-200 shrink-0 ${
                selectedMonth === month
                  ? type === "misbak"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20 scale-105"
                    : "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/20 scale-105"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
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
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-7 gap-1.5">
            {/* Day Labels */}
            {["እሁድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ"].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-500 py-2 text-xs uppercase tracking-wider">
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
                  className={`aspect-square rounded-xl p-1.5 text-center transition-all duration-200 ${
                    hasData
                      ? type === "misbak"
                        ? "bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 hover:border-blue-500 cursor-pointer hover:shadow-md hover:shadow-blue-200/50 active:scale-95"
                        : "bg-green-50 hover:bg-green-100 border-2 border-green-300 hover:border-green-500 cursor-pointer hover:shadow-md hover:shadow-green-200/50 active:scale-95"
                      : "bg-gray-50/50 border border-gray-100 cursor-default opacity-60"
                  }`}
                >
                  <div className={`font-bold text-sm ${hasData ? "text-gray-900" : "text-gray-400"}`}>
                    {day}
                  </div>
                  {hasData && (
                    <div className="mt-1 flex justify-center gap-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${type === "misbak" ? "bg-blue-500" : "bg-green-500"} animate-pulse`} />
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
              {minbabatCategories.map((cat) => {
                const value = selectedItem[cat];
                const hasData = !!value;
                return (
                  <div key={cat} className={`border-l-4 ${hasData ? "border-green-500" : "border-gray-300"} pl-4`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{cat}</p>
                        {hasData && (
                          <p className="text-sm text-gray-600">{value?.title || "No title"}</p>
                        )}
                        {!hasData && (
                          <p className="text-sm text-gray-400 italic">Not added yet</p>
                        )}
                      </div>
                    </div>
                    {hasData && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{value?.content || ""}</p>
                    )}
                  </div>
                );
              })}
            </div>
            {canEdit && (
              <button
                onClick={() => {
                  // Pre-fill edit-all data with current values
                  const allData: any = {};
                  minbabatCategories.forEach((cat) => {
                    const val = selectedItem[cat];
                    allData[cat] = {
                      title: val?.title || "",
                      content: val?.content || "",
                    };
                  });
                  setEditAllData(allData);
                  setShowEditAllModal(true);
                }}
                className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Edit All Categories
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal - Misbak */}
      {(showAddModal || showEditModal) && type === "misbak" && !showDetailView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              resetForm();
            }}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    {showAddModal ? (
                      <Plus className="w-5 h-5 text-white" />
                    ) : (
                      <Edit className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {showAddModal ? "Add New ምስባክ" : "Edit ምስባክ"}
                    </h3>
                    <p className="text-sm text-blue-200">
                      {showAddModal
                        ? "Add a new misbak entry for a specific date"
                        : "Update the misbak entry"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-white/60 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-5">
              {showAddModal && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      ቀን (Date)
                    </label>
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
                  </div>
                  {formData.date && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                      <p className="text-sm text-blue-800">
                        <strong>Selected:</strong> {formData.date}
                        {formData.dayOfWeek && ` — ${formData.dayOfWeek}`}
                      </p>
                    </div>
                  )}
                </>
              )}
              {showEditModal && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                  <p className="text-sm text-blue-800">
                    <strong>Editing:</strong> {selectedItem?.date}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ግዕዝ (Geez Text)
                </label>
                <textarea
                  placeholder="Enter the Geez scripture text..."
                  value={formData.geez || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, geez: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 h-28 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ትርጉም (Translation)
                </label>
                <textarea
                  placeholder="Enter the Amharic translation..."
                  value={formData.translation || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, translation: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 h-28 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ቅዳሴ (Liturgy)
                </label>
                <input
                  type="text"
                  placeholder="e.g., ቅዳሴ፦ ዘዲዮስቆሮስ"
                  value={formData.liturgy || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, liturgy: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                />
              </div>

              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  {validationErrors.map((err, i) => (
                    <p key={i} className="text-sm text-red-800 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {err}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={showAddModal ? handleAdd : handleEdit}
                disabled={saving}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : showAddModal ? "Add Entry" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal - Minbabat - Step-through */}
      {showAddModal && type === "minbabat" && !showDetailView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleFinishAdd}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Add New ምንባባት</h3>
                    <p className="text-sm text-green-200">
                      Add readings for a specific date
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleFinishAdd}
                  className="text-white/60 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Date Picker */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ቀን (Date)
                </label>
                <EthiopianDatePicker
                  selectedDate={formData.date || ""}
                  onDateSelect={(date, dayOfWeek) => {
                    const existing = minbabatData[date] || {};
                    const existingCats = Object.keys(existing);
                    const firstAvailable = minbabatCategories.find(c => !existingCats.includes(c));

                    setFormData({
                      ...formData,
                      date,
                      dayOfWeek,
                      category: firstAvailable || "",
                      title: "",
                      content: "",
                    });
                    setAddedCategories(existingCats);
                  }}
                />
              </div>

              {formData.date && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Calendar className="w-4 h-4 text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm text-green-800">
                      <strong>Selected:</strong> {formData.date}
                    </p>
                    <p className="text-xs text-green-600 mt-0.5">
                      {addedCategories.length > 0
                        ? `${addedCategories.length} of ${minbabatCategories.length} categories already exist`
                        : "No existing categories for this date"}
                    </p>
                  </div>
                </div>
              )}

              {/* Category Progress */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Categories — {addedCategories.length} / {minbabatCategories.length} done
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {minbabatCategories.map((cat) => {
                    const isAdded = addedCategories.includes(cat);
                    const isCurrent = formData.category === cat;
                    return (
                      <div
                        key={cat}
                        className={`px-3 py-2.5 rounded-lg text-sm border transition-all ${
                          isAdded
                            ? "bg-green-100 border-green-400 text-green-800"
                            : isCurrent
                            ? "bg-green-50 border-green-500 text-green-800 font-medium ring-2 ring-green-300"
                            : "bg-gray-50 border-gray-200 text-gray-400"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isAdded ? (
                            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                          ) : isCurrent ? (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0" />
                          ) : (
                            <div className="w-2 h-2 bg-gray-300 rounded-full shrink-0" />
                          )}
                          <span className="truncate">{cat}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category selection */}
              {formData.date && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Select Category
                  </label>
                  <select
                    value={formData.category || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value, title: "", content: "" })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all duration-200"
                  >
                    <option value="">-- Pick a category --</option>
                    {minbabatCategories.map((cat) => {
                      const isDone = addedCategories.includes(cat);
                      return (
                        <option key={cat} value={cat} disabled={isDone}>
                          {cat} {isDone ? "(done)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ርዕስ (Title)
                </label>
                <input
                  type="text"
                  placeholder="e.g., ሮሜ 8:1-17"
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all duration-200"
                />
              </div>

              {/* Content Textarea */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ይዘት (Content)
                </label>
                <textarea
                  placeholder="Enter the scripture reading content..."
                  value={formData.content || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 h-32 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all duration-200"
                />
              </div>

              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  {validationErrors.map((err, i) => (
                    <p key={i} className="text-sm text-red-800 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {err}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={handleFinishAdd}
                disabled={saving}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
              >
                {addedCategories.length > 0 ? "Done" : "Cancel"}
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !formData.date || !formData.category}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 rounded-lg hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit All Modal - Minbabat */}
      {showEditAllModal && type === "minbabat" && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Edit — {selectedItem.date}
              </h3>
              <button
                onClick={() => setShowEditAllModal(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6">
              {minbabatCategories.map((cat) => {
                const data = editAllData[cat] || { title: "", content: "" };
                const hasExisting = !!selectedItem[cat];
                return (
                  <div
                    key={cat}
                    className={`border rounded-lg p-4 ${
                      hasExisting
                        ? "border-green-300 bg-green-50/50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          hasExisting ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                      <p className="font-semibold text-gray-900">{cat}</p>
                      {!hasExisting && (
                        <span className="text-xs text-gray-400 italic">New</span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder={`Title for ${cat}`}
                        value={data.title || ""}
                        onChange={(e) =>
                          setEditAllData({
                            ...editAllData,
                            [cat]: { ...data, title: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg text-gray-900"
                      />
                      <textarea
                        placeholder={`Content for ${cat}`}
                        value={data.content || ""}
                        onChange={(e) =>
                          setEditAllData({
                            ...editAllData,
                            [cat]: { ...data, content: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg h-24 text-gray-900"
                      />
                    </div>
                  </div>
                );
              })}

              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  {validationErrors.map((err, i) => (
                    <p key={i} className="text-sm text-red-800 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {err}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleEditAllSave}
                  disabled={saving}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Save className="w-5 h-5" />
                  {saving ? "Saving..." : "Save All Changes"}
                </button>
                <button
                  onClick={() => setShowEditAllModal(false)}
                  disabled={saving}
                  className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
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

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all transform animate-slide-in ${
              toast.type === "success"
                ? "bg-green-600"
                : "bg-red-600"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
