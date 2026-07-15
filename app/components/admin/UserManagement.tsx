"use client";

import { useEffect, useState } from "react";
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  X,
  Users,
  Shield,
  UserCheck,
  Activity,
} from "lucide-react";

interface User {
  id: string;
  telegramId: string;
  fullName: string;
  baptismName: string | null;
  phoneNumber: string | null;
  address: string | null;
  role: string;
  status: string;
}

interface Props {
  currentUser: any;
  isSuperAdmin: boolean;
  initData: string | null;
}

const ROLE_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  SUPER_ADMIN: { bg: "bg-gradient-to-r from-amber-500 to-yellow-500", text: "text-white", label: "Super Admin" },
  ADMIN: { bg: "bg-gradient-to-r from-purple-500 to-indigo-500", text: "text-white", label: "Admin" },
  MEMBER: { bg: "bg-gradient-to-r from-blue-500 to-cyan-500", text: "text-white", label: "Member" },
};

const STATUS_BADGES: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  INACTIVE: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
};

export default function UserManagement({
  currentUser,
  isSuperAdmin,
  initData,
}: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    baptismName: "",
    phoneNumber: "",
    address: "",
    telegramId: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(q) ||
        user.baptismName?.toLowerCase().includes(q) ||
        user.phoneNumber?.includes(q) ||
        user.telegramId.includes(q),
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users", {
        headers: initData ? { "x-telegram-init-data": initData } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  };

  const handleAddUser = async () => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(initData ? { "x-telegram-init-data": initData } : {}),
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const newUser = await res.json();
        setUsers([newUser, ...users]);
        setShowAddModal(false);
        resetForm();
      }
    } catch (err) {
      console.error("Add user error:", err);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(initData ? { "x-telegram-init-data": initData } : {}),
        },
        body: JSON.stringify({ ...formData, id: selectedUser.id }),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        const updatedUsers = users.map((u) =>
          u.id === selectedUser.id ? updatedUser : u,
        );
        setUsers(updatedUsers);
        setShowEditModal(false);
        resetForm();
      }
    } catch (err) {
      console.error("Edit user error:", err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
        headers: initData ? { "x-telegram-init-data": initData } : {},
      });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== userId));
      }
    } catch (err) {
      console.error("Delete user error:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      baptismName: "",
      phoneNumber: "",
      address: "",
      telegramId: "",
    });
    setSelectedUser(null);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      baptismName: user.baptismName || "",
      phoneNumber: user.phoneNumber || "",
      address: user.address || "",
      telegramId: user.telegramId,
    });
    setShowEditModal(true);
  };

  const admins = users.filter(
    (u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN",
  );
  const members = users.filter((u) => u.role === "MEMBER");

  const statsCards = [
    {
      label: "Total Users",
      value: users.length,
      icon: Users,
      gradient: "from-purple-600 to-purple-800",
      shadow: "shadow-purple-500/20",
    },
    {
      label: "Admins",
      value: admins.length,
      icon: Shield,
      gradient: "from-indigo-600 to-indigo-800",
      shadow: "shadow-indigo-500/20",
    },
    {
      label: "Members",
      value: members.length,
      icon: UserCheck,
      gradient: "from-blue-600 to-blue-800",
      shadow: "shadow-blue-500/20",
    },
    {
      label: "Active",
      value: users.filter((u) => u.status === "ACTIVE").length,
      icon: Activity,
      gradient: "from-emerald-600 to-emerald-800",
      shadow: "shadow-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`relative group bg-gradient-to-br ${stat.gradient} rounded-xl ${stat.shadow} shadow-lg p-5 text-white overflow-hidden transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl`}
            >
              {/* Decorative circle */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-sm" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full blur-sm" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <Icon className="w-6 h-6 text-white/80" />
                  <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
                <p className="text-3xl font-bold tracking-tight">
                  {stat.value}
                </p>
                <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/30 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (stat.value / Math.max(1, users.length)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Add */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:border-gray-200">
        <div className="flex-1 flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-100 focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-100 transition-all duration-200">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone or Telegram ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-2.5 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 font-medium text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No users found</h3>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "Try a different search term"
                : "Click 'Add User' to get started"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredUsers.map((user, index) => {
                const roleBadge = ROLE_BADGES[user.role] || ROLE_BADGES.MEMBER;
                const statusBadge = STATUS_BADGES[user.status] || STATUS_BADGES.ACTIVE;
                const initial = user.fullName.charAt(0).toUpperCase();

                return (
                  <div
                    key={user.id}
                    className="group flex items-center gap-4 px-5 py-4 hover:bg-gray-50/80 transition-all duration-200"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                      user.role === "SUPER_ADMIN"
                        ? "bg-gradient-to-br from-amber-400 to-yellow-500"
                        : user.role === "ADMIN"
                        ? "bg-gradient-to-br from-purple-400 to-indigo-500"
                        : "bg-gradient-to-br from-blue-400 to-cyan-500"
                    }`}>
                      {initial}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.fullName}
                        </p>
                        {user.baptismName && (
                          <span className="text-xs text-gray-400 hidden sm:inline">
                            ({user.baptismName})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {user.phoneNumber && (
                          <span className="truncate">{user.phoneNumber}</span>
                        )}
                        {user.address && (
                          <span className="truncate hidden md:inline">{user.address}</span>
                        )}
                        <span className="text-gray-300">ID: {user.telegramId}</span>
                      </div>
                    </div>

                    {/* Role & Status */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleBadge.bg} ${roleBadge.text} shadow-sm`}>
                        {roleBadge.label}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                        {user.status}
                      </span>
                    </div>

                    {/* Actions - visible on mobile, hover reveal on desktop */}
                    {(isSuperAdmin || currentUser?.role === "ADMIN") && (
                      <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 shrink-0">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
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
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    {showAddModal ? (
                      <UserPlus className="w-5 h-5 text-white" />
                    ) : (
                      <Edit className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {showAddModal ? "Add New User" : "Edit User"}
                    </h3>
                    <p className="text-sm text-purple-200">
                      {showAddModal
                        ? "Create a new user account"
                        : "Update user information"}
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
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ሙሉ ስም (Full Name)
                </label>
                <input
                  type="text"
                  placeholder="e.g., ዮሐንስ ተስፋዬ"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ክርስትና ስም (Baptism Name)
                </label>
                <input
                  type="text"
                  placeholder="e.g., ዮሐንስ"
                  value={formData.baptismName}
                  onChange={(e) =>
                    setFormData({ ...formData, baptismName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    ስልክ ቁጥር (Phone)
                  </label>
                  <input
                    type="text"
                    placeholder="+251-..."
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all duration-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    አድራሻ (Address)
                  </label>
                  <input
                    type="text"
                    placeholder="City, Area"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all duration-200"
                  />
                </div>
              </div>

              {showAddModal && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Telegram ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 123456789"
                    value={formData.telegramId}
                    onChange={(e) =>
                      setFormData({ ...formData, telegramId: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all duration-200"
                  />
                  <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-amber-600 text-xs shrink-0 mt-0.5">💡</span>
                    <p className="text-xs text-amber-800">
                      Ask the user to message{" "}
                      <a
                        href="https://t.me/userinfobot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline hover:text-amber-900"
                      >
                        @userinfobot
                      </a>{" "}
                      on Telegram to get their ID
                    </p>
                  </div>
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
                onClick={showAddModal ? handleAddUser : handleEditUser}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
              >
                {showAddModal ? "Add User" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
