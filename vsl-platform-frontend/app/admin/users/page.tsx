"use client";

import { useState, useEffect } from "react"; // 1. Thêm useEffect
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Terminal, 
  LayoutDashboard, 
  Users, 
  FileText, 
  BookOpen, 
  LogOut, 
  Lock, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  X,
  Save,
  Shield,
  UserCheck,
  Activity,
  Eye, 
  Key,
  User as UserIcon // 2. Đổi tên icon User để tránh trùng lặp
} from "lucide-react";
import styles from "../../../styles/admin-users.module.css";

interface User {
  id: number;
  username: string;
  email: string;
  role: "ADMIN" | "USER" | "MODERATOR";
  status: "ACTIVE" | "INACTIVE";
  lastLogin: string;
  joinDate: string;
  avatar?: string;
}

export default function AdminUsersPage() {
  const pathname = usePathname();

  // 3. Logic đồng hồ và Admin Name
  const [currentDateTime, setCurrentDateTime] = useState<string>("");
  const adminName = "SHERRY";

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB'); 
      const timeStr = now.toLocaleTimeString('en-GB');
      setCurrentDateTime(`${dateStr} - ${timeStr}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    { label: "[DASHBOARD]", href: "/admin", icon: LayoutDashboard },
    { label: "[USER_MANAGEMENT]", href: "/admin/users", icon: Users },
    { label: "[CONTRIBUTIONS]", href: "/admin/contributions", icon: FileText },
    { label: "[DICTIONARY_DB]", href: "/admin/dictionary", icon: BookOpen },
  ];

  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      username: "admin_core",
      email: "admin@vsl.vn",
      role: "ADMIN",
      status: "ACTIVE",
      lastLogin: "Today, 10:42 AM",
      joinDate: "01/01/2024",
      avatar: "https://ui-avatars.com/api/?name=Admin+Core&background=0D8ABC&color=fff"
    },
    {
      id: 2,
      username: "contributor_01",
      email: "contributor@vsl.vn",
      role: "MODERATOR",
      status: "ACTIVE",
      lastLogin: "Yesterday, 15:30 PM",
      joinDate: "15/02/2024",
      avatar: "https://ui-avatars.com/api/?name=Contributor+01&background=random"
    },
    {
      id: 3,
      username: "user_test_99",
      email: "test99@gmail.com",
      role: "USER",
      status: "INACTIVE",
      lastLogin: "2 days ago",
      joinDate: "20/05/2024",
      avatar: "https://ui-avatars.com/api/?name=User+Test&background=random"
    },
    {
      id: 4,
      username: "newbie_2024",
      email: "newbie@yahoo.com",
      role: "USER",
      status: "ACTIVE",
      lastLogin: "Just now",
      joinDate: "10/12/2024",
      avatar: "https://ui-avatars.com/api/?name=Newbie&background=random"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [newPassword, setNewPassword] = useState(""); 
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = () => {
    setCurrentUser({ role: "USER", status: "ACTIVE" });
    setIsEditMode(false);
    setNewPassword("");
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setIsEditMode(true);
    setNewPassword(""); 
    setIsModalOpen(true);
  };

  const handleViewProfile = (user: User) => {
    setViewUser(user);
    setIsProfileModalOpen(true);
  };

  const handleDeleteUser = (id: number) => {
    if(confirm("WARNING: Are you sure you want to delete this user? This action cannot be undone.")) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleSave = () => {
    if (newPassword) {
        console.log(`Updating password for user ${currentUser.username} to: ${newPassword}`);
    }
    alert("User data saved successfully! (Mock Action)");
    setIsModalOpen(false);
  };

  return (
    <div className={styles["admin-container"]}>
      
      {/* 4. STATUS BAR MỚI */}
      <div className={styles["status-bar"]}>
        <div className={styles["status-bar-left"]}>
            <div className={styles["status-item"]}>
                <span className={styles["status-indicator"]}></span>
                <span>SYSTEM: ONLINE</span>
            </div>
            <div className={styles["status-item"]}>
                <UserIcon size={14} /> {/* Dùng UserIcon ở đây */}
                <span style={{textTransform: 'uppercase'}}>ADMIN: {adminName}</span>
            </div>
        </div>
        <div className={styles["status-item"]}>
            <span>{currentDateTime}</span>
        </div>
      </div>

      <aside className={styles.sidebar}>
        <div className={styles["sidebar-header"]}>
           <div className="flex items-center gap-2">
             <Lock size={16}/> VSL_ADMIN
           </div>
           CORE
        </div>
        
        <ul className={styles["sidebar-menu"]}>
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

      <main className={styles["main-content"]}>
        <div className={styles["page-header"]}>
          <div className={styles["page-title"]}>
            <Users size={24} /> USER MANAGEMENT
          </div>
        </div>

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
                  <td>
                    <div className={styles["user-info-cell"]}>
                      <img 
                        src={user.avatar || "/default-avatar.png"} 
                        alt="avt" 
                        className={styles["user-avatar"]}
                      />
                      <span 
                        className={styles["clickable-name"]}
                        onClick={() => handleViewProfile(user)}
                        title="Click to view profile"
                      >
                        {user.username}
                      </span>
                    </div>
                  </td>
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
                        onClick={() => handleViewProfile(user)}
                        title="View Profile"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        className={styles["btn-icon"]}
                        onClick={() => handleEditUser(user)}
                        title="Edit User & Password"
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

      {isProfileModalOpen && viewUser && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal"]}>
            <div className={styles["modal-header"]}>
              <span className={styles["modal-title"]}>USER PROFILE</span>
              <button className={styles["modal-close"]} onClick={() => setIsProfileModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles["modal-body"]}>
              <div className={styles["profile-view-header"]}>
                <img 
                  src={viewUser.avatar} 
                  alt="Avatar" 
                  className={styles["profile-large-avatar"]} 
                />
                <div className={styles["profile-username"]}>{viewUser.username}</div>
                <div className={styles["profile-email"]}>{viewUser.email}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={styles["form-group"]}>
                  <label className={styles["form-label"]}>ROLE</label>
                  <input type="text" className={styles["form-input"]} value={viewUser.role} readOnly />
                </div>
                <div className={styles["form-group"]}>
                  <label className={styles["form-label"]}>STATUS</label>
                  <input type="text" className={styles["form-input"]} value={viewUser.status} readOnly />
                </div>
                <div className={styles["form-group"]}>
                  <label className={styles["form-label"]}>JOINED DATE</label>
                  <input type="text" className={styles["form-input"]} value={viewUser.joinDate} readOnly />
                </div>
                <div className={styles["form-group"]}>
                  <label className={styles["form-label"]}>LAST LOGIN</label>
                  <input type="text" className={styles["form-input"]} value={viewUser.lastLogin} readOnly />
                </div>
              </div>
            </div>

            <div className={styles["modal-footer"]}>
              <button 
                className={`${styles["btn-modal"]} ${styles["btn-save"]}`}
                onClick={() => {
                  setIsProfileModalOpen(false);
                  handleEditUser(viewUser);
                }}
              >
                <Edit size={14} style={{marginRight: 5}}/> EDIT PROFILE
              </button>
            </div>
          </div>
        </div>
      )}

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

              <div className={styles["form-group"]} style={{marginTop: '10px', borderTop: '1px dashed #333', paddingTop: '15px'}}>
                <label className={styles["form-label"]} style={{color: '#fff', display:'flex', alignItems:'center', gap:'5px'}}>
                  <Key size={12} /> 
                  {isEditMode ? "CHANGE PASSWORD (OPTIONAL)" : "INITIAL PASSWORD"}
                </label>
                <input 
                  type="password" 
                  className={styles["form-input"]} 
                  placeholder={isEditMode ? "Leave blank to keep current..." : "Required..."}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

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