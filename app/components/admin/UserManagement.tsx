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
  Send,
  AlertTriangle,
  MessageCircle,
} from "lucide-react";

interface User {
  id: string;
  telegramId: string | null;
  fullName: string;
  baptismName: string | null;
  phoneNumber: string | null;
  address: string | null;
  deactivationReason: string | null;
  role: string;
  status: string;
}

interface Props {
  currentUser: any;
  isSuperAdmin: boolean;
  initData: string | null;
}

const ROLE_BADGES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  SUPER_ADMIN: {
    bg: "bg-gradient-to-r from-amber-500 to-yellow-500",
    text: "text-white",
    label: "Super Admin",
  },
  ADMIN: {
    bg: "bg-gradient-to-r from-purple-500 to-indigo-500",
    text: "text-white",
    label: "Admin",
  },
  MEMBER: {
    bg: "bg-gradient-to-r from-blue-500 to-cyan-500",
    text: "text-white",
    label: "Member",
  },
};

const STATUS_BADGES: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  ACTIVE: {
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  INACTIVE: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
  PENDING: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
  },
  SUSPENDED: {
    bg: "bg-red-100",
    text: "text-red-700",
    dot: "bg-red-500",
  },
};

export default function UserManagement({
  currentUser,
  isSuperAdmin,
  initData,
}: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [usersError, setUsersError] = useState("");

  const [askingUserId, setAskingUserId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [formError, setFormError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAskConfirm, setShowAskConfirm] = useState(false);

  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [askAudience, setAskAudience] = useState<"" | "all" | "ACTIVE" | "INACTIVE">("");

  const [formData, setFormData] = useState({
    fullName: "",
    baptismName: "",
    phoneNumber: "",
    address: "",
    telegramId: "",
    status: "ACTIVE",
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
        (user.telegramId && user.telegramId.includes(q)),
    );

    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users", {
        headers: initData
          ? { "x-telegram-init-data": initData }
          : {},
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));

        setUsersError(
          error.details ||
            error.error ||
            "Unable to load users.",
        );

        return;
      }

      const data = await res.json();

      setUsers(data);
      setFilteredUsers(data);
      setUsersError("");
    } catch (err) {
      console.error("Fetch users error:", err);
      setUsersError("Unable to connect to the users service.");
    }
  };

  /*
   * =========================================================
   * ASK IN TELEGRAM
   * =========================================================
   */

  const openAskConfirm = (user: User) => {
    setActionError("");
    setActionSuccess("");
    setAskAudience("");
    setSelectedUser(user);
    setShowAskConfirm(true);
  };

  const closeAskConfirm = () => {
    if (askingUserId) return;

    setShowAskConfirm(false);
    setActionError("");
    setActionSuccess("");
    setAskAudience("");
    setSelectedUser(null);
  };

  const handleAskInTelegram = async () => {
    if (!selectedUser && !askAudience) return;

    setAskingUserId(selectedUser?.id ?? "bulk");
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch("/api/admin/users/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(initData
            ? { "x-telegram-init-data": initData }
            : {}),
        },
        body: JSON.stringify({
          ...(selectedUser
            ? { userId: selectedUser.id }
            : { audience: askAudience }),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setActionError(
          data.error ||
            "Could not send the Telegram message.",
        );
        return;
      }

      const sentCount = data.sentCount ?? 1;
      const failedCount = data.failedCount ?? 0;
      const total = data.total ?? sentCount + failedCount;
      const target = selectedUser
        ? selectedUser.fullName
        : askAudience === "all"
          ? "All linked users"
          : `${askAudience} users`;
      setActionSuccess(
        `${target}: sent ${sentCount} of ${total} Telegram messages.${
          failedCount > 0 ? ` ${failedCount} failed.` : " All succeeded."
        }`,
      );
    } catch (err) {
      console.error("Ask in Telegram error:", err);

      setActionError(
        "Could not send the Telegram message.",
      );
    } finally {
      setAskingUserId(null);
    }
  };

  /*
   * =========================================================
   * ADD USER
   * =========================================================
   */

  const handleAddUser = async () => {
    setFormError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(initData
            ? { "x-telegram-init-data": initData }
            : {}),
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newUser = await res.json();

        setUsers((currentUsers) => [
          newUser,
          ...currentUsers,
        ]);

        setShowAddModal(false);
        resetForm();
      } else {
        const err = await res.json().catch(() => ({}));

        setFormError(
          err.error || "Failed to add user",
        );
      }
    } catch (err) {
      console.error("Add user error:", err);
      setFormError("Failed to add user");
    }
  };

  /*
   * =========================================================
   * EDIT USER
   * =========================================================
   */

  const handleEditUser = async () => {
    if (!selectedUser) return;

    setFormError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(initData
            ? { "x-telegram-init-data": initData }
            : {}),
        },
        body: JSON.stringify({
          ...formData,
          id: selectedUser.id,
        }),
      });

      if (res.ok) {
        const updatedUser = await res.json();

        const updatedUsers = users.map((u) =>
          u.id === selectedUser.id
            ? updatedUser
            : u,
        );

        setUsers(updatedUsers);
        setShowEditModal(false);
        resetForm();
      } else {
        const err = await res.json().catch(() => ({}));

        setFormError(
          err.error || "Failed to update user",
        );
      }
    } catch (err) {
      console.error("Edit user error:", err);
      setFormError("Failed to update user");
    }
  };

  /*
   * =========================================================
   * DELETE USER
   * =========================================================
   */

  const openDeleteConfirm = (user: User) => {
    setActionError("");
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setActionError("");
    setSelectedUser(null);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setActionError("");

    try {
      const res = await fetch(
        `/api/admin/users?id=${selectedUser.id}`,
        {
          method: "DELETE",
          headers: initData
            ? {
                "x-telegram-init-data": initData,
              }
            : {},
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setActionError(
          data.error || "Failed to delete user.",
        );
        return;
      }

      setUsers((currentUsers) =>
        currentUsers.filter(
          (u) => u.id !== selectedUser.id,
        ),
      );

      setShowDeleteConfirm(false);
      setSelectedUser(null);
      setActionError("");
    } catch (err) {
      console.error("Delete user error:", err);

      setActionError("Failed to delete user.");
    }
  };

  /*
   * =========================================================
   * FORM
   * =========================================================
   */

  const resetForm = () => {
    setFormData({
      fullName: "",
      baptismName: "",
      phoneNumber: "",
      address: "",
      telegramId: "",
      status: "ACTIVE",
    });

    setFormError("");
    setSelectedUser(null);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);

    setFormData({
      fullName: user.fullName,
      baptismName: user.baptismName || "",
      phoneNumber: user.phoneNumber || "",
      address: user.address || "",
      telegramId: user.telegramId || "",
      status: user.status || "ACTIVE",
    });

    setFormError("");
    setShowEditModal(true);
  };

  const closeFormModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
  };

  /*
   * =========================================================
   * STATS
   * =========================================================
   */

  const admins = users.filter(
    (u) =>
      u.role === "ADMIN" ||
      u.role === "SUPER_ADMIN",
  );

  const members = users.filter(
    (u) => u.role === "MEMBER",
  );

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
      value: users.filter(
        (u) => u.status === "ACTIVE",
      ).length,
      icon: Activity,
      gradient: "from-emerald-600 to-emerald-800",
      shadow: "shadow-emerald-500/20",
    },
  ];

  const linkedUsers = users.filter(
    (user) =>
      user.telegramId && !user.telegramId.startsWith("pending_"),
  );
  const askAudienceCount =
    askAudience === "all"
      ? linkedUsers.length
      : askAudience
        ? linkedUsers.filter((user) => user.status === askAudience).length
        : 0;

  return (
    <div className="space-y-6">
      {/* =====================================================
          STATS
      ====================================================== */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className={`relative group bg-gradient-to-br ${stat.gradient} rounded-xl ${stat.shadow} shadow-lg p-5 text-white overflow-hidden transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl`}
            >
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
                    style={{
                      width: `${Math.min(
                        100,
                        (stat.value /
                          Math.max(
                            1,
                            users.length,
                          )) *
                          100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================
          SEARCH
      ====================================================== */}

      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:border-gray-200">
        <div className="flex-1 flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-100 focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-100 transition-all duration-200">
          <Search className="w-5 h-5 text-gray-400" />

          <input
            type="text"
            placeholder="Search by name, phone or Telegram ID..."
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(e.target.value)
            }
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
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-2.5 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 font-medium text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => {
              setActionError("");
              setActionSuccess("");
              setAskAudience("");
              setSelectedUser(null);
              setShowAskConfirm(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95 font-medium text-sm"
          >
            <Send className="w-4 h-4" />
            Ask in Telegram
          </button>
        )}
      </div>

      {/* =====================================================
          USERS
      ====================================================== */}

      <div className="space-y-2">
        {usersError ? (
          <div className="bg-red-50 rounded-xl border border-red-200 p-8 text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-1">
              Unable to load users
            </h3>

            <p className="text-sm text-red-700">
              {usersError}
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              No users found
            </h3>

            <p className="text-sm text-gray-500">
              {searchQuery
                ? "Try a different search term"
                : "No users are registered in the connected database yet."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredUsers.map(
                (user, index) => {
                  const roleBadge =
                    ROLE_BADGES[user.role] ||
                    ROLE_BADGES.MEMBER;

                  const statusBadge =
                    STATUS_BADGES[user.status] ||
                    STATUS_BADGES.ACTIVE;

                  const initial =
                    user.fullName
                      .charAt(0)
                      .toUpperCase();

                  /*
                   * IMPORTANT:
                   *
                   * ACTIVE:
                   * Edit + Delete
                   *
                   * INACTIVE:
                   * Edit + Ask in Telegram + Delete
                   *
                   * Only SUPER_ADMIN can use Delete/Ask.
                   */

                  const isInactive =
                    user.status === "INACTIVE";

                  return (
                    <div
                      key={user.id}
                      className="group flex items-center gap-4 px-5 py-4 hover:bg-gray-50/80 transition-all duration-200"
                      style={{
                        animationDelay: `${index * 30}ms`,
                      }}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                          user.role ===
                          "SUPER_ADMIN"
                            ? "bg-gradient-to-br from-amber-400 to-yellow-500"
                            : user.role ===
                              "ADMIN"
                            ? "bg-gradient-to-br from-purple-400 to-indigo-500"
                            : "bg-gradient-to-br from-blue-400 to-cyan-500"
                        }`}
                      >
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
                            <span className="truncate">
                              {user.phoneNumber}
                            </span>
                          )}

                          {user.address && (
                            <span className="truncate hidden md:inline">
                              {user.address}
                            </span>
                          )}

                          <span className="text-gray-300">
                            ID: {user.telegramId || "Not linked"}
                          </span>

                          {user.deactivationReason && (
                            <span
                              className="text-amber-700 truncate"
                              title={
                                user.deactivationReason
                              }
                            >
                              Reason:{" "}
                              {
                                user.deactivationReason
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Role & Status */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleBadge.bg} ${roleBadge.text} shadow-sm`}
                        >
                          {roleBadge.label}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge.bg} ${statusBadge.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`}
                          />

                          {user.status}
                        </span>
                      </div>

                      {/* =================================================
                          ACTIONS
                          ALWAYS VISIBLE
                      ================================================== */}

                      {(isSuperAdmin ||
                        currentUser?.role ===
                          "ADMIN") && (
                        <div className="flex items-center gap-1 shrink-0">
                          {/* EDIT
                              Visible for ACTIVE + INACTIVE */}
                          <button
                            onClick={() =>
                              openEditModal(user)
                            }
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                            title="Edit user"
                            aria-label={`Edit ${user.fullName}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* ASK IN TELEGRAM
                              ONLY INACTIVE
                              ONLY SUPER ADMIN
                          */}
                          {isSuperAdmin &&
                            isInactive && (
                              <button
                                onClick={() =>
                                  openAskConfirm(
                                    user,
                                  )
                                }
                                disabled={
                                  askingUserId ===
                                    user.id ||
                                  !user.telegramId ||
                                  user.telegramId.startsWith(
                                    "pending_",
                                  )
                                }
                                className="flex items-center gap-1.5 px-2 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                title={
                                  user.telegramId &&
                                  !user.telegramId.startsWith(
                                    "pending_",
                                  )
                                    ? "Ask in Telegram"
                                    : "Telegram account is not linked"
                                }
                                aria-label={`Ask ${user.fullName} in Telegram`}
                              >
                                <Send className="w-4 h-4" />

                                <span className="hidden lg:inline">
                                  Ask in Telegram
                                </span>
                              </button>
                            )}

                          {/* DELETE
                              ACTIVE + INACTIVE
                              ONLY SUPER ADMIN */}
                          {isSuperAdmin && (
                            <button
                              onClick={() =>
                                openDeleteConfirm(
                                  user,
                                )
                              }
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                              title="Delete user"
                              aria-label={`Delete ${user.fullName}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          ADD / EDIT MODAL
      ====================================================== */}

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeFormModal}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
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
                      {showAddModal
                        ? "Add New User"
                        : "Edit User"}
                    </h3>

                    <p className="text-sm text-purple-200">
                      {showAddModal
                        ? "Create a new user account"
                        : "Update user information"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeFormModal}
                  className="text-white/60 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700">
                    ⚠️ {formError}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ሙሉ ስም (Full Name)
                </label>

                <input
                  type="text"
                  placeholder="e.g., ዮሐንስ ተስፋዬ"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fullName:
                        e.target.value,
                    })
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
                    setFormData({
                      ...formData,
                      baptismName:
                        e.target.value,
                    })
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
                      setFormData({
                        ...formData,
                        phoneNumber:
                          e.target.value,
                      })
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
                      setFormData({
                        ...formData,
                        address:
                          e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all duration-200"
                  />
                </div>
              </div>

              {!showAddModal && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    ሁኔታ (Status)
                  </label>

                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status:
                          e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-all duration-200 ${
                      formData.status ===
                      "ACTIVE"
                        ? "border-green-200 bg-green-50 text-green-700 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                        : formData.status ===
                          "INACTIVE"
                        ? "border-gray-200 bg-gray-50 text-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        : "border-red-200 bg-red-50 text-red-700 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    }`}
                  >
                    <option value="ACTIVE">
                      ACTIVE — ተጠቃሚ በስራ ላይ
                    </option>

                    <option value="INACTIVE">
                      INACTIVE — ድህረ ገጽ ዝግ (Disabled)
                    </option>

                    <option value="SUSPENDED">
                      SUSPENDED — ማገድ
                    </option>
                  </select>
                </div>
              )}

              {showAddModal && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    ℹ️ The user will link their
                    Telegram account when they
                    first access the bot. No
                    Telegram ID needed now.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={closeFormModal}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>

              <button
                onClick={
                  showAddModal
                    ? handleAddUser
                    : handleEditUser
                }
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
              >
                {showAddModal
                  ? "Add User"
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}

      {showDeleteConfirm &&
        selectedUser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeDeleteConfirm}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      Delete User
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Are you sure you want to delete this
                      user?
                    </p>
                  </div>

                  <button
                    onClick={closeDeleteConfirm}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-5">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="font-semibold text-gray-900">
                    {selectedUser.fullName}
                  </p>

                  {selectedUser.phoneNumber && (
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedUser.phoneNumber}
                    </p>
                  )}

                  <p className="text-xs text-red-600 mt-3">
                    This action cannot be undone.
                  </p>
                </div>

                {actionError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      {actionError}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={closeDeleteConfirm}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDeleteUser}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}

      {/* =====================================================
          ASK IN TELEGRAM CONFIRMATION MODAL
      ====================================================== */}

      {showAskConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeAskConfirm}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      Ask in Telegram
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      {selectedUser
                        ? "Send a message to this user in Telegram?"
                        : "Choose which users to ask whether they want to continue."}
                    </p>
                  </div>

                  <button
                    onClick={closeAskConfirm}
                    disabled={!!askingUserId}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-40"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-5">
                {selectedUser ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                        {selectedUser.fullName.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900">
                          {selectedUser.fullName}
                        </p>

                        <p className="text-xs text-gray-500 mt-0.5">
                          Telegram ID: {selectedUser.telegramId}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-gray-700">
                      Select audience
                    </span>
                    <select
                      value={askAudience}
                      onChange={(event) =>
                        setAskAudience(
                          event.target.value as "" | "all" | "ACTIVE" | "INACTIVE",
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Choose an audience...</option>
                      <option value="all">All users ({linkedUsers.length})</option>
                      <option value="ACTIVE">
                        Active ({linkedUsers.filter((user) => user.status === "ACTIVE").length})
                      </option>
                      <option value="INACTIVE">
                        Inactive ({linkedUsers.filter((user) => user.status === "INACTIVE").length})
                      </option>
                    </select>
                  </label>
                )}

                {(selectedUser || askAudience) && (
                  <p className="text-sm text-gray-600 mt-4">
                    {selectedUser
                      ? "A Telegram message will be sent asking this user whether they want to continue."
                      : `${askAudienceCount} linked user${askAudienceCount === 1 ? "" : "s"} will receive the question.`}
                  </p>
                )}

                {askAudience && askAudienceCount === 0 && (
                  <p className="text-sm text-amber-700 mt-3">
                    No linked Telegram users match this audience.
                  </p>
                )}

                {actionError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      {actionError}
                    </p>
                  </div>
                )}

                {actionSuccess && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">{actionSuccess}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={closeAskConfirm}
                  disabled={!!askingUserId}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleAskInTelegram}
                  disabled={
                    !!askingUserId ||
                    (!selectedUser && (!askAudience || askAudienceCount === 0))
                  }
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />

                  {askingUserId
                    ? "Sending..."
                    : selectedUser
                      ? "Send Message"
                      : `Send to ${askAudienceCount} users`}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}