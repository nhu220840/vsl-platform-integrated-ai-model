"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // 1. Import hook
import { 
  Terminal, 
  LayoutDashboard, 
  Users, 
  FileText, 
  BookOpen, 
  LogOut, 
  Lock, // Icon ổ khóa cho header sidebar
  Plus, 
  Edit, 
  Trash2, 
  Search,
  X,
  Save,
  Shield,
  UserCheck,
  Activity
} from "lucide-react";
import styles from "../../../styles/admin-users.module.css";

// Interface User
interface User {
  id: number;
  username: string;
  email: string;
  role: "ADMIN" | "USER" | "MODERATOR";
  status: "ACTIVE" | "INACTIVE";
  lastLogin: string;
  joinDate: string;
}

export default function AdminUsersPage() {
  const pathname = usePathname(); // 2. Lấy đường dẫn hiện tại

  // 3. Cấu hình Menu
  const menuItems = [
    { label: "[DASHBOARD]", href: "/admin", icon: LayoutDashboard },
    { label: "[USER_MANAGER]", href: "/admin/users", icon: Users },
    { label: "[CONTRIBUTIONS]", href: "/admin/contributions", icon: FileText },
    { label: "[DICTIONARY_DB]", href: "/admin/dictionary", icon: BookOpen },
  ];

  // --- LOGIC USERS (Data & State) ---
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      username: "admin_core",
      email: "admin@vsl.vn",
      role: "ADMIN",
      status: "ACTIVE",
      lastLogin: "Today, 10:42 AM",
      joinDate: "01/01/2024"
    },
    {
      id: 2,
      username: "contributor_01",
      email: "contributor@vsl.vn",
      role: "MODERATOR",
      status: "ACTIVE",
      lastLogin: "Yesterday, 15:30 PM",
      joinDate: "15/02/2024"
    },
    {
      id: 3,
      username: "user_test_99",
      email: "test99@gmail.com",
      role: "USER",
      status: "INACTIVE",
      lastLogin: "2 days ago",
      joinDate: "20/05/2024"
    },
    {
      id: 4,
      username: "newbie_2024",
      email: "newbie@yahoo.com",
      role: "USER",
      status: "ACTIVE",
      lastLogin: "Just now",
      joinDate: "10/12/2024"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User>>({});
  const [isEditMode, setIsEditMode] = useState(false);

  // Filter Logic
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleAddUser = () => {
    setCurrentUser({ role: "USER", status: "ACTIVE" });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDeleteUser = (id: number) => {
    if(confirm("WARNING: Are you sure you want to delete this user? This action cannot be undone.")) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleSave = () => {
    alert("Saved user data successfully! (Mock Action)");
    setIsModalOpen(false);
  };

  return (
    <div className={styles["admin-container"]}>
      
      {/* --- STATUS BAR --- */}
      <div className={styles["status-bar"]}>
        <div className={styles["status-bar-left"]}>
            <div className={styles["status-item"]}>
                <span className={styles["status-indicator"]}></span>
                <span>SYSTEM: ONLINE</span>
            </div>
            <div className={styles["status-item"]}>
                <span>USER_DB: CONNECTED</span>
            </div>
        </div>
        <div className={styles["status-item"]}>
            <span>SECURE_MODE</span>
        </div>
      </div>

      {/* --- SIDEBAR (Dynamic Logic) --- */}
      <aside className={styles.sidebar}>
        <div className={styles["sidebar-header"]}>
           <div className="flex items-center gap-2">
             <Lock size={16}/> VSL_ADMIN
           </div>
           CORE
        </div>
        
        <ul className={styles["sidebar-menu"]}>
          {/* 4. Render Menu tự động */}
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.href}>
                <Link 
                  href={item.href} 
                  className={`${styles["menu-item"]} ${isActive ? styles["menu-item-active"] : ""}`}
                >
                  <span className={styles["icon-wrapper"]}><Icon size={16}/></span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}

          <li>
            <div className={styles["menu-item"]} style={{cursor: 'pointer'}}>
               <span className={styles["icon-wrapper"]}><LogOut size={16}/></span>
               <span>[LOGOUT]</span>
            </div>
          </li>
        </ul>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className={styles["main-content"]}>
        
        <div className={styles["page-header"]}>
          <div className={styles["page-title"]}>
            <Users size={24} /> USER MANAGEMENT
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles["stats-container"]}>
          <div className={styles["stat-card"]}>
            <div className={styles["stat-icon"]}><Users /></div>
            <div className={styles["stat-info"]}>
              <span className={styles["stat-value"]}>{users.length}</span>
              <span className={styles["stat-label"]}>TOTAL USERS</span>
            </div>
          </div>
          <div className={styles["stat-card"]}>
            <div className={styles["stat-icon"]}><UserCheck /></div>
            <div className={styles["stat-info"]}>
              <span className={styles["stat-value"]}>
                {users.filter(u => u.status === "ACTIVE").length}
              </span>
              <span className={styles["stat-label"]}>ACTIVE NOW</span>
            </div>
          </div>
          <div className={styles["stat-card"]}>
            <div className={styles["stat-icon"]}><Shield /></div>
            <div className={styles["stat-info"]}>
              <span className={styles["stat-value"]}>
                {users.filter(u => u.role === "ADMIN" || u.role === "MODERATOR").length}
              </span>
              <span className={styles["stat-label"]}>ADMIN/MODS</span>
            </div>
          </div>
          <div className={styles["stat-card"]}>
            <div className={styles["stat-icon"]}><Activity /></div>
            <div className={styles["stat-info"]}>
              <span className={styles["stat-value"]}>98%</span>
              <span className={styles["stat-label"]}>RETENTION</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles["toolbar"]}>
          <div className="flex gap-2 flex-1">
            <input 
              type="text" 
              className={styles["search-box"]} 
              placeholder="Search user by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className={styles["btn-add"]} style={{width: 'auto'}} onClick={() => {}}>
                <Search size={16} />
            </button>
          </div>
          <button className={styles["btn-add"]} onClick={handleAddUser}>
            <Plus size={16} /> ADD USER
          </button>
        </div>

        {/* Data Table */}
        <div className={styles["table-container"]}>
          <table className={styles["data-table"]}>
            <thead>
              <tr>
                <th>ID</th>
                <th>USERNAME</th>
                <th>EMAIL</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th>LAST LOGIN</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>#{user.id}</td>
                  <td style={{fontWeight: 'bold', color: '#fff'}}>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles["role-badge"]} ${user.role === 'ADMIN' ? styles["role-admin"] : styles["role-user"]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className={user.status === 'ACTIVE' ? styles["status-active"] : styles["status-inactive"]}>
                    {user.status}
                  </td>
                  <td>{user.lastLogin}</td>
                  <td>
                    <div className={styles["action-buttons"]}>
                      <button 
                        className={styles["btn-icon"]}
                        onClick={() => handleEditUser(user)}
                        title="Edit User"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className={`${styles["btn-icon"]} ${styles["btn-icon-danger"]}`}
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete User"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>

      {/* Modal Popup */}
      {isModalOpen && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal"]}>
            <div className={styles["modal-header"]}>
              <span className={styles["modal-title"]}>
                {isEditMode ? `EDIT USER: ${currentUser.username}` : "CREATE NEW USER"}
              </span>
              <button className={styles["modal-close"]} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles["modal-body"]}>
              <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>USERNAME</label>
                <input 
                  type="text" 
                  className={styles["form-input"]} 
                  defaultValue={currentUser.username}
                  placeholder="Enter username..."
                />
              </div>
              
              <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  className={styles["form-input"]} 
                  defaultValue={currentUser.email}
                  placeholder="user@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={styles["form-group"]}>
                  <label className={styles["form-label"]}>ROLE</label>
                  <select className={styles["form-select"]} defaultValue={currentUser.role}>
                    <option value="USER">USER</option>
                    <option value="MODERATOR">MODERATOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div className={styles["form-group"]}>
                  <label className={styles["form-label"]}>STATUS</label>
                  <select className={styles["form-select"]} defaultValue={currentUser.status}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="BANNED">BANNED</option>
                  </select>
                </div>
              </div>

              {!isEditMode && (
                <div className={styles["form-group"]}>
                  <label className={styles["form-label"]}>INITIAL PASSWORD</label>
                  <input 
                    type="password" 
                    className={styles["form-input"]} 
                    placeholder="••••••••"
                  />
                </div>
              )}
            </div>

            <div className={styles["modal-footer"]}>
              <button 
                className={`${styles["btn-modal"]} ${styles["btn-cancel"]}`}
                onClick={() => setIsModalOpen(false)}
              >
                CANCEL
              </button>
              <button 
                className={`${styles["btn-modal"]} ${styles["btn-save"]}`}
                onClick={handleSave}
              >
                <Save size={14} style={{marginRight: 5}}/> SAVE CHANGES
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}