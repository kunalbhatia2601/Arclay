"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// Debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    // Debounce search value
    const debouncedSearch = useDebounce(search, 400);

    useEffect(() => {
        fetchUsers();
    }, [pagination.page, debouncedSearch, roleFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: 10,
                search: debouncedSearch,
                role: roleFilter,
            });
            const res = await fetch(`/api/admin/users?${params}`, {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setUsers(data.users);
                setPagination((prev) => ({
                    ...prev,
                    pages: data.pagination.pages,
                    total: data.pagination.total,
                }));
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-foreground">
                        Users
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your user accounts
                    </p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-card rounded-2xl p-4 border border-border flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPagination({ ...pagination, page: 1 });
                    }}
                    className="flex-1 px-4 py-2 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                    value={roleFilter}
                    onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setPagination({ ...pagination, page: 1 });
                    }}
                    className="px-4 py-2 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No users found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                                        User
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground hidden md:table-cell">
                                        Phone
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                                        Role
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                                        Status
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground hidden lg:table-cell">
                                        Joined
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users.map((user) => (
                                    <tr key={user._id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                                    {user.name?.[0]?.toUpperCase() || "U"}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground line-clamp-1">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="text-muted-foreground text-sm">
                                                {user.phone || "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === "admin"
                                                        ? "bg-accent/10 text-accent"
                                                        : "bg-secondary/20 text-secondary-foreground"
                                                    }`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${user.isActive
                                                        ? "bg-green-500/10 text-green-600"
                                                        : "bg-muted-foreground/10 text-muted-foreground"
                                                    }`}
                                            >
                                                {user.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <span className="text-muted-foreground text-sm">
                                                {formatDate(user.createdAt)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                            Showing {(pagination.page - 1) * 10 + 1} to{" "}
                            {Math.min(pagination.page * 10, pagination.total)} of{" "}
                            {pagination.total}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                disabled={pagination.page === pagination.pages}
                                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
