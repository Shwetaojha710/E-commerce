import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { adminAPI } from '../../api/user.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, growth, icon, color }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="card p-6"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
        {icon}
      </div>
      {growth !== undefined && (
        <span className={`text-sm font-semibold ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {growth >= 0 ? '↑' : '↓'} {Math.abs(growth)}%
        </span>
      )}
    </div>
    <p className="text-2xl font-extrabold mb-1">{value}</p>
    <p className="text-sm text-gray-500">{title}</p>
  </motion.div>
);

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const statusLabels = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="text-center py-10 text-gray-500">Failed to load dashboard</div>;

  const { stats, recentOrders, revenueChart, orderStatusBreakdown, topProducts } = data;

  const revenueData = revenueChart?.map((item) => ({
    month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
    revenue: Math.round(item.revenue),
    orders: item.orders,
  })) || [];

  const statusData = orderStatusBreakdown?.map((item) => ({
    name: statusLabels[item._id] || item._id,
    value: item.count,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₹${(stats.totalRevenue / 1000).toFixed(1)}K`}
          icon="💰"
          color="bg-primary-100 dark:bg-primary-900/30"
        />
        <StatCard
          title="This Month"
          value={`₹${stats.monthRevenue.toFixed(0)}`}
          growth={stats.revenueGrowth}
          icon="📈"
          color="bg-green-100 dark:bg-green-900/30"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          icon="🛒"
          color="bg-yellow-100 dark:bg-yellow-900/30"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon="👥"
          color="bg-purple-100 dark:bg-purple-900/30"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Month Orders" value={stats.monthOrders} icon="📦" color="bg-blue-100 dark:bg-blue-900/30" />
        <StatCard title="New Users" value={stats.monthUsers} icon="👤" color="bg-pink-100 dark:bg-pink-900/30" />
        <StatCard title="Low Stock" value={stats.lowStockProducts} icon="⚠️" color="bg-red-100 dark:bg-red-900/30" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 card p-6">
          <h2 className="font-semibold mb-4">Revenue Overview</h2>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">No revenue data yet</div>
          )}
        </div>

        {/* Order Status Pie */}
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Order Status</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">No orders yet</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-primary-600 hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {recentOrders?.map((order) => (
              <div key={order._id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-gray-500 text-xs">{order.user?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{order.totalAmount?.toFixed(0)}</p>
                  <span className={`badge text-xs capitalize ${
                    order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.orderStatus}
                  </span>
                </div>
              </div>
            ))}
            {(!recentOrders || recentOrders.length === 0) && (
              <p className="text-gray-400 text-sm text-center py-4">No orders yet</p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Top Products</h2>
            <Link to="/admin/products" className="text-sm text-primary-600 hover:underline">Manage</Link>
          </div>
          <div className="space-y-3">
            {topProducts?.map((product, i) => (
              <div key={product._id} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <img
                  src={product.images?.[0]?.url}
                  alt={product.name}
                  className="w-10 h-10 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-gray-500 text-xs">{product.soldCount} sold</p>
                </div>
                <span className="font-semibold">₹{product.price?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
