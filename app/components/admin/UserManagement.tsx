"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus, Edit, Trash2, X } from "lucide-react";

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
    const filtered = users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.baptismName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phoneNumber?.includes(searchQuery),
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

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Admins</p>
          <p className="text-3xl font-bold text-purple-600">{admins.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Members</p>
          <p className="text-3xl font-bold text-blue-600">{members.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Active</p>
          <p className="text-3xl font-bold text-green-600">
            {users.filter((u) => u.status === "ACTIVE").length}
          </p>
        </div>
      </div>

      {/* Search & Add */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-4">
        <div className="flex-1 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none text-gray-900"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  ስም
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  ክርስትና ስም
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  ስልክ ቁጥር
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  አድራሻ
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                  Role
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                  Status
                </th>
                {(isSuperAdmin || currentUser?.role === "ADMIN") && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {user.fullName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {user.baptismName || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {user.phoneNumber || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {user.address || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        user.role === "SUPER_ADMIN"
                          ? "bg-yellow-100 text-yellow-800"
                          : user.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-800">
                      {user.status}
                    </span>
                  </td>
                  {(isSuperAdmin || currentUser?.role === "ADMIN") && (
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {showAddModal ? "Add New User" : "Edit User"}
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
              <input
                type="text"
                placeholder="ስም (Full Name)"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg text-gray-900"
              />
              <input
                type="text"
                placeholder="ክርስትና ስም (Baptism Name)"
                value={formData.baptismName}
                onChange={(e) =>
                  setFormData({ ...formData, baptismName: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg text-gray-900"
              />
              <input
                type="text"
                placeholder="ስልክ ቁጥር (Phone Number)"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg text-gray-900"
              />
              <input
                type="text"
                placeholder="አድራሻ (Address)"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg text-gray-900"
              />
              {showAddModal && (
                <div>
                  <input
                    type="text"
                    placeholder="Telegram ID (e.g., 123456789)"
                    value={formData.telegramId}
                    onChange={(e) =>
                      setFormData({ ...formData, telegramId: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg text-gray-900"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    ℹ️ To get Telegram ID: Ask user to message{" "}
                    <a
                      href="https://t.me/userinfobot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      @userinfobot
                    </a>{" "}
                    on Telegram
                  </p>
                </div>
              )}
              <button
                onClick={showAddModal ? handleAddUser : handleEditUser}
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
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
