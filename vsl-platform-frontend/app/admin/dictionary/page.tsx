"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Terminal, 
  LayoutDashboard, 
  Users, 
  FileText, 
  BookOpen, 
  LogOut, 
  Lock, // Icon ổ khóa cho Sidebar
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Video, 
  X, 
  Save,
  TrendingUp, 
  Upload, 
} from "lucide-react";
import styles from "../../../styles/admin-dictionary.module.css";

// Interface Dictionary
interface DictionaryItem {
  id: number;
  word: string;
  category: string;
  difficulty: string;
  views: number;
  videoUrl: string;
  status: "PUBLISHED" | "DRAFT";
  definition: string;
}

export default function AdminDictionaryPage() {
  // --- LOGIC DICTIONARY (Data & State) ---
  const [words, setWords] = useState<DictionaryItem[]>([
    {
      id: 1,
      word: "Xin chào",
      category: "Greeting",
      difficulty: "Easy",
      views: 1234,
      videoUrl: "https://youtu.be/example1",
      status: "PUBLISHED",
      definition: "Lời chào hỏi thông thường."
    },
    {
      id: 2,
      word: "Cảm ơn",
      category: "Greeting",
      difficulty: "Easy",
      views: 956,
      videoUrl: "https://youtu.be/example2",
      status: "PUBLISHED",
      definition: "Lời nói biểu thị sự biết ơn."
    },
    {
      id: 3,
      word: "Xin lỗi",
      category: "Greeting",
      difficulty: "Easy",
      views: 782,
      videoUrl: "",
      status: "DRAFT",
      definition: "Lời nói biểu thị sự hối lỗi."
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWord, setCurrentWord] = useState<Partial<DictionaryItem>>({});
  const [isEditMode, setIsEditMode] = useState(false);

  // Filter
  const filteredWords = words.filter((item) =>
    item.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleAddNew = () => {
    setCurrentWord({});
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEdit = (item: DictionaryItem) => {
    setCurrentWord(item);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      setWords(words.filter((w) => w.id !== id));
    }
  };

  const handleSave = () => {
    alert("Saved successfully! (Mock)");
    setIsModalOpen(false);
  };

  return (
    <div className={styles["admin-container"]}>
      {/* --- TOP STATUS BAR (Local) --- */}
      <div className={styles["status-bar"]}>
        <span className={styles["status-text"]}>
          <span className="flex items-center gap-2">
             <Terminal size={14} /> SYSTEM: DICTIONARY_DATABASE | ACCESS: GRANTED
          </span>
        </span>
        <div className={styles["status-indicator"]}>
          <span className={styles["indicator-dot"]}></span>
          <span>ONLINE</span>
        </div>
      </div>

     {/* --- Sidebar --- */}
     <aside className={styles.sidebar}>
        <div className={styles["sidebar-header"]}>
           <div className="flex items-center gap-2">
             <Lock size={16}/> VSL_ADMIN
           </div>
           CORE
        </div>
        
        <ul className={styles["sidebar-menu"]}>
          <li>
            <Link href="/admin" className={styles["menu-item"]}>
              <span className={styles["icon-wrapper"]}><TrendingUp size={16}/></span>
              <span>[DASHBOARD]</span>
            </Link>
          </li>
          <li>
            <Link href="/admin/users" className={styles["menu-item"]}>
              <span className={styles["icon-wrapper"]}><Users size={16}/></span>
              <span>[USER_MANAGER]</span>
            </Link>
          </li>
          <li>
            <div className={`${styles["menu-item"]} ${styles["menu-item-active"]}`}>
              <span className={styles["icon-wrapper"]}><Upload size={16}/></span>
              <span>[CONTRIBUTIONS]</span>
            </div>
          </li>
          <li>
            <Link href="/admin/dictionary" className={styles["menu-item"]}>
               <span className={styles["icon-wrapper"]}><BookOpen size={16}/></span>
               <span>[DICTIONARY_DB]</span>
            </Link>
          </li>
          <li>
            <div className={styles["menu-item"]}>
               <span className={styles["icon-wrapper"]}><LogOut size={16}/></span>
               <span>[LOGOUT]</span>
            </div>
          </li>
        </ul>
      </aside>


      {/* --- MAIN CONTENT (Dictionary Logic) --- */}
      <main className={styles["main-content"]}>
        
        {/* Header: Title & Search */}
        <div className={styles["page-header"]}>
          <div className={styles["page-title"]}>
            <BookOpen size={24} />
            DICTIONARY_DATABASE
          </div>
          
          <div className={styles["search-container"]}>
            <input 
              type="text" 
              placeholder="Search by keyword..." 
              className={styles["search-box"]}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className={styles["btn-add"]} onClick={handleAddNew}>
              <Plus size={16} /> ADD NEW WORD
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className={styles["table-container"]}>
          <table className={styles["data-table"]}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Word</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th>Views</th>
                <th>Video</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWords.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td style={{ fontWeight: 'bold', color: '#fff' }}>{item.word}</td>
                  <td>{item.category}</td>
                  <td>{item.difficulty}</td>
                  <td>{item.views}</td>
                  <td>
                    {item.videoUrl ? (
                      <a href={item.videoUrl} target="_blank" rel="noreferrer" className={styles["video-link"]}>
                        <Video size={14} /> View
                      </a>
                    ) : (
                      <span style={{color:'#666'}}>-</span>
                    )}
                  </td>
                  <td>
                    <span className={`${styles["status-badge"]} ${item.status === "PUBLISHED" ? styles["status-published"] : styles["status-draft"]}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles["action-buttons"]}>
                      <button 
                        className={styles["btn-icon"]} 
                        title="Edit"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className={`${styles["btn-icon"]} ${styles["btn-icon-danger"]}`} 
                        title="Delete"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>

      {/* Modal Popup (Dictionary Logic) */}
      {isModalOpen && (
        <div className={styles["modal-overlay"]}>
          <div className={styles["modal"]}>
            <div className={styles["modal-header"]}>
              <span className={styles["modal-title"]}>
                {isEditMode ? "EDIT ENTRY" : "ADD NEW ENTRY"}
              </span>
              <button className={styles["modal-close"]} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles["modal-body"]}>
              <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>WORD</label>
                <input 
                  type="text" 
                  className={styles["form-input"]} 
                  defaultValue={currentWord.word}
                />
              </div>
              
              <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>CATEGORY</label>
                <select className={styles["form-select"]} defaultValue={currentWord.category}>
                  <option>Greeting</option>
                  <option>Family</option>
                  <option>Work</option>
                  <option>Travel</option>
                </select>
              </div>

              <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>DIFFICULTY</label>
                <select className={styles["form-select"]} defaultValue={currentWord.difficulty}>
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>

              <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>VIDEO URL (YOUTUBE)</label>
                <input 
                  type="text" 
                  className={styles["form-input"]} 
                  defaultValue={currentWord.videoUrl}
                  placeholder="https://..."
                />
              </div>

              <div className={styles["form-group"]}>
                <label className={styles["form-label"]}>DEFINITION</label>
                <textarea 
                  className={styles["form-textarea"]}
                  defaultValue={currentWord.definition}
                ></textarea>
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
                <Save size={14} style={{marginRight:5}}/> SAVE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}