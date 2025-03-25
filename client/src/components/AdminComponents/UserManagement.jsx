import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  Edit,
  Trash2,
  Lock,
  Unlock,
  MoreHorizontal,
  User,
  Mail,
  Calendar,
  Shield,
  Eye,
  RefreshCw,
  ShieldAlert,
  CheckCircle,
  EyeIcon,
  Ban,
  UserPlus,
  SlidersHorizontal,
  Download,
  XCircle,
} from "lucide-react";
import AdminService from "../../services/adminService";

// Import các component con
import UserTable from "./UserManagement/UserTable";
import UserDetailModal from "./UserManagement/UserDetailModal";
import BanUserModal from "./UserManagement/BanUserModal";
import AddUserModal from "./UserManagement/AddUserModal";
import EmptyState from "./UserManagement/EmptyState";
import UserFilters from "./UserManagement/UserFilters";
import UserPagination from "./UserManagement/UserPagination";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDisplayDropdown, setShowDisplayDropdown] = useState(false);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    isAdmin: false,
  });

  // Add click outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close dropdowns when clicking outside
      if (!event.target.closest(".dropdown-container")) {
        setShowFilterDropdown(false);
        setShowDisplayDropdown(false);
        setShowSortDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sử dụng useCallback cho fetchUsers để đảm bảo nó không tạo lại khi render
  const fetchUsers = useCallback(
    async (
      currentPage = page,
      limit = usersPerPage,
      currentFilter = filter,
      search = searchTerm
    ) => {
      setIsLoading(true);
      try {
        const filterObject = {};

        if (search) {
          filterObject.search = search;
        }

        if (currentFilter === "banned") {
          filterObject.isBanned = true;
        } else if (currentFilter === "active") {
          filterObject.isBanned = false;
        }

        // Thêm thông tin sắp xếp
        filterObject.sortBy = sortBy;
        filterObject.sortDirection = sortDirection;

        console.log("Fetching users with filter:", filterObject);

        const response = await AdminService.getAllUsers(
          currentPage,
          limit,
          filterObject
        );

        if (response && response.code === 1) {
          console.log("API response:", response);
          setUsers(response.data.users);
          setTotalPages(response.data.pagination.totalPages);
          setTotalUsers(response.data.pagination.total);
        } else {
          console.error("Lỗi khi lấy danh sách người dùng:", response);
          // Tạo dữ liệu mẫu khi API không trả về dữ liệu
          const mockUsers = [
            {
              _id: "1",
              name: "Nguyễn Văn A",
              username: "nguyenvana",
              email: "nguyenvana@example.com",
              createdAt: "2023-01-15T08:30:00Z",
              lastLogin: "2023-06-20T14:25:00Z",
              isAdmin: false,
              isBanned: false,
              avatar: "https://randomuser.me/api/portraits/men/1.jpg",
            },
            {
              _id: "2",
              name: "Trần Thị B",
              username: "tranthib",
              email: "tranthib@example.com",
              createdAt: "2023-02-20T10:15:00Z",
              lastLogin: "2023-06-19T09:10:00Z",
              isAdmin: true,
              isBanned: false,
              avatar: "https://randomuser.me/api/portraits/women/2.jpg",
            },
            {
              _id: "3",
              name: "Lê Văn C",
              username: "levanc",
              email: "levanc@example.com",
              createdAt: "2023-03-10T14:45:00Z",
              lastLogin: "2023-06-15T16:30:00Z",
              isAdmin: false,
              isBanned: true,
              banReason: "Vi phạm quy tắc cộng đồng",
              banExpiration: "2023-08-15T14:45:00Z",
              avatar: "https://randomuser.me/api/portraits/men/3.jpg",
            },
            {
              _id: "4",
              name: "Phạm Thị D",
              username: "phamthid",
              email: "phamthid@example.com",
              createdAt: "2023-04-05T09:20:00Z",
              lastLogin: "2023-06-18T11:45:00Z",
              isAdmin: false,
              isBanned: false,
              avatar: "https://randomuser.me/api/portraits/women/4.jpg",
            },
            {
              _id: "5",
              name: "Hoàng Văn E",
              username: "hoangvane",
              email: "hoangvane@example.com",
              createdAt: "2023-05-12T16:35:00Z",
              lastLogin: "2023-06-17T08:20:00Z",
              isAdmin: false,
              isBanned: false,
              avatar: "https://randomuser.me/api/portraits/men/5.jpg",
            },
          ];
          setUsers(mockUsers);
          setTotalPages(1);
          setTotalUsers(mockUsers.length);
        }
      } catch (error) {
        console.error("Không thể lấy danh sách người dùng:", error);
        // Tạo dữ liệu mẫu khi API gặp lỗi
        const mockUsers = [
          {
            _id: "1",
            name: "Nguyễn Văn A",
            username: "nguyenvana",
            email: "nguyenvana@example.com",
            createdAt: "2023-01-15T08:30:00Z",
            lastLogin: "2023-06-20T14:25:00Z",
            isAdmin: false,
            isBanned: false,
            avatar: "https://randomuser.me/api/portraits/men/1.jpg",
          },
          {
            _id: "2",
            name: "Trần Thị B",
            username: "tranthib",
            email: "tranthib@example.com",
            createdAt: "2023-02-20T10:15:00Z",
            lastLogin: "2023-06-19T09:10:00Z",
            isAdmin: true,
            isBanned: false,
            avatar: "https://randomuser.me/api/portraits/women/2.jpg",
          },
          {
            _id: "3",
            name: "Lê Văn C",
            username: "levanc",
            email: "levanc@example.com",
            createdAt: "2023-03-10T14:45:00Z",
            lastLogin: "2023-06-15T16:30:00Z",
            isAdmin: false,
            isBanned: true,
            banReason: "Vi phạm quy tắc cộng đồng",
            banExpiration: "2023-08-15T14:45:00Z",
            avatar: "https://randomuser.me/api/portraits/men/3.jpg",
          },
          {
            _id: "4",
            name: "Phạm Thị D",
            username: "phamthid",
            email: "phamthid@example.com",
            createdAt: "2023-04-05T09:20:00Z",
            lastLogin: "2023-06-18T11:45:00Z",
            isAdmin: false,
            isBanned: false,
            avatar: "https://randomuser.me/api/portraits/women/4.jpg",
          },
          {
            _id: "5",
            name: "Hoàng Văn E",
            username: "hoangvane",
            email: "hoangvane@example.com",
            createdAt: "2023-05-12T16:35:00Z",
            lastLogin: "2023-06-17T08:20:00Z",
            isAdmin: false,
            isBanned: false,
            avatar: "https://randomuser.me/api/portraits/men/5.jpg",
          },
        ];
        setUsers(mockUsers);
        setTotalPages(1);
        setTotalUsers(mockUsers.length);
      } finally {
        setIsLoading(false);
      }
    },
    [page, usersPerPage, filter, searchTerm, sortBy, sortDirection]
  );

  // Fetch users on component mount and when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Các hàm xử lý sự kiện với useCallback
  const handleUserDetail = useCallback((user) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  }, []);

  const handleDeleteUser = useCallback(async (userId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      setIsLoading(true);
      try {
        const response = await AdminService.deleteUser(userId);
        if (response && response.code === 1) {
          // Remove user from the local state
          setUsers((users) => users.filter((user) => user._id !== userId));
          alert("Xóa người dùng thành công");
        } else {
          alert(
            "Không thể xóa người dùng: " +
              (response?.message || "Lỗi không xác định")
          );
        }
      } catch (error) {
        console.error("Delete user error:", error);
        alert("Lỗi khi xóa người dùng: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  const handleBanUser = useCallback((user) => {
    setSelectedUser(user);
    setBanReason("");
    setBanDuration(0);
    setShowBanModal(true);
  }, []);

  const submitBanUser = useCallback(async () => {
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      const response = await AdminService.banUser(
        selectedUser._id,
        banReason,
        parseInt(banDuration)
      );

      if (response && response.code === 1) {
        // Update the user in local state
        setUsers((users) =>
          users.map((user) =>
            user._id === selectedUser._id ? { ...user, isBanned: true } : user
          )
        );
        alert("Khóa tài khoản thành công");
        setShowBanModal(false);
      } else {
        alert(
          "Không thể khóa tài khoản: " +
            (response?.message || "Lỗi không xác định")
        );
      }
    } catch (error) {
      console.error("Ban user error:", error);
      alert("Lỗi khi khóa tài khoản: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedUser, banReason, banDuration]);

  const submitUnbanUser = useCallback((userId) => {
    if (window.confirm("Bạn có chắc chắn muốn mở khóa người dùng này?")) {
      setIsLoading(true);
      AdminService.unbanUser(userId)
        .then((response) => {
          if (response && response.code === 1) {
            // Update the user in local state
            setUsers((users) =>
              users.map((user) =>
                user._id === userId ? { ...user, isBanned: false } : user
              )
            );
            alert("Mở khóa tài khoản thành công");
          } else {
            alert(
              "Không thể mở khóa tài khoản: " +
                (response?.message || "Lỗi không xác định")
            );
          }
        })
        .catch((error) => {
          console.error("Unban user error:", error);
          alert("Lỗi khi mở khóa tài khoản: " + error.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, []);

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Định nghĩa handleRefresh với useCallback
  const handleRefresh = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Định nghĩa handleNewUserChange với useCallback
  const handleNewUserChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setNewUserData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  // Định nghĩa handleAddUser với useCallback
  const handleAddUser = useCallback(
    async (e) => {
      e.preventDefault();

      if (
        !newUserData.name ||
        !newUserData.username ||
        !newUserData.email ||
        !newUserData.password
      ) {
        alert("Vui lòng điền đầy đủ thông tin người dùng!");
        return;
      }

      setIsLoading(true);
      try {
        // Giả lập thêm người dùng thành công khi API chưa hoàn thiện
        // khi có API thì sẽ gọi AdminService.addUser(newUserData)
        const mockResponse = {
          code: 1,
          message: "Thêm người dùng thành công",
          data: {
            ...newUserData,
            _id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
              newUserData.name
            )}&background=random`,
          },
        };

        // Thêm người dùng mới vào state
        const newUser = mockResponse.data;
        setUsers((prevUsers) => [newUser, ...prevUsers]);

        alert("Thêm người dùng mới thành công!");
        setShowAddUserModal(false);

        // Reset form
        setNewUserData({
          name: "",
          username: "",
          email: "",
          password: "",
          isAdmin: false,
        });
      } catch (error) {
        console.error("Lỗi thêm người dùng:", error);
        alert("Lỗi khi thêm người dùng: " + error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [newUserData]
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            ) : (
              <RefreshCw size={16} className="mr-2" />
            )}
            {isLoading ? "Đang tải..." : "Làm mới"}
          </button>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
          >
            <UserPlus size={16} className="mr-2" />
            Thêm người dùng
          </button>
          <div className="dropdown-container relative">
            <button
              onClick={() => setShowDisplayDropdown(!showDisplayDropdown)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              <SlidersHorizontal size={16} className="mr-2" />
              Hiển thị
              <ChevronDown size={16} className="ml-2" />
            </button>
            {showDisplayDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                {/* Dropdown content for display options */}
                <div className="p-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số người dùng mỗi trang:
                  </label>
                  <select
                    value={usersPerPage}
                    onChange={(e) => setUsersPerPage(Number(e.target.value))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        {/* Filters Component */}
        <UserFilters
          searchTerm={searchTerm}
          handleSearch={handleSearch}
          filter={filter}
          setFilter={setFilter}
          usersPerPage={usersPerPage}
          setUsersPerPage={setUsersPerPage}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
          showFilterDropdown={showFilterDropdown}
          setShowFilterDropdown={setShowFilterDropdown}
          showDisplayDropdown={showDisplayDropdown}
          setShowDisplayDropdown={setShowDisplayDropdown}
          showSortDropdown={showSortDropdown}
          setShowSortDropdown={setShowSortDropdown}
        />

        {/* Hiển thị thông báo đang tải */}
        {isLoading && (
          <div className="flex justify-center items-center p-8">
            <div className="h-8 w-8 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-gray-600">
              Đang tải dữ liệu người dùng...
            </span>
          </div>
        )}

        {/* Hiển thị danh sách người dùng */}
        {!isLoading && users.length > 0 && (
          <UserTable
            users={users}
            handleUserDetail={handleUserDetail}
            handleDeleteUser={handleDeleteUser}
            submitUnbanUser={submitUnbanUser}
            handleBanUser={handleBanUser}
            sortBy={sortBy}
            sortDirection={sortDirection}
            setSortBy={setSortBy}
            setSortDirection={setSortDirection}
          />
        )}

        {/* Empty State Component */}
        {!isLoading && users.length === 0 && (
          <EmptyState searchTerm={searchTerm} handleRefresh={handleRefresh} />
        )}
      </div>

      {/* Modals */}
      {showUserDetail && (
        <UserDetailModal
          selectedUser={selectedUser}
          setShowUserDetail={setShowUserDetail}
          submitUnbanUser={submitUnbanUser}
          handleBanUser={handleBanUser}
        />
      )}

      {showBanModal && selectedUser && (
        <BanUserModal
          selectedUser={selectedUser}
          setShowBanModal={setShowBanModal}
          banReason={banReason}
          setBanReason={setBanReason}
          banDuration={banDuration}
          setBanDuration={setBanDuration}
          submitBanUser={submitBanUser}
          isLoading={isLoading}
        />
      )}

      {showAddUserModal && (
        <AddUserModal
          setShowAddUserModal={setShowAddUserModal}
          newUserData={newUserData}
          handleNewUserChange={handleNewUserChange}
          handleAddUser={handleAddUser}
          isLoading={isLoading}
        />
      )}

      {/* Pagination Component */}
      {!isLoading && users.length > 0 && (
        <UserPagination
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          users={users}
          totalUsers={totalUsers}
        />
      )}
    </div>
  );
};

export default UserManagement;
