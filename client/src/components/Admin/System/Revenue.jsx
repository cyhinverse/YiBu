import React, { useState, useEffect } from "react";
import { DollarSign, TrendingUp, CreditCard } from "lucide-react";
// import AdminService from "../../../services/adminService";
import { toast } from "react-hot-toast";

const RevenueCard = ({ title, amount, subtext, color }) => (
    <div className={`p-6 rounded-xl text-white ${color} shadow-lg`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-white/80 font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold">${amount.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign size={24} />
            </div>
        </div>
        <p className="mt-4 text-sm text-white/90">{subtext}</p>
    </div>
);

const Revenue = () => {
    const [revenueData, setRevenueData] = useState({
        total: 12500,
        monthly: 3200,
        today: 150
    });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch real data logic here
        // setRevenueData(...);
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Revenue Management</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <RevenueCard 
                    title="Total Revenue" 
                    amount={revenueData.total} 
                    subtext="+15% from last year"
                    color="bg-gradient-to-br from-green-500 to-emerald-600"
                />
                 <RevenueCard 
                    title="This Month" 
                    amount={revenueData.monthly} 
                    subtext="+5% from last month"
                    color="bg-gradient-to-br from-blue-500 to-indigo-600"
                />
                 <RevenueCard 
                    title="Today" 
                    amount={revenueData.today} 
                    subtext="8 transactions processed"
                    color="bg-gradient-to-br from-purple-500 to-violet-600"
                />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold mb-4">Recent Transactions</h3>
                <div className="text-center text-gray-500 py-8">
                    <p>Transaction list implementation pending backend integration.</p>
                </div>
            </div>
        </div>
    );
};

export default Revenue;
