import { useState, useEffect } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const Sheet = () => {
    const [role, setRole] = useState("");
    const [columns, setColumns] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);

    useEffect(() => {
        if (role) {
            axios.get(`http://localhost:4000/api/columns?role=${role}`)
                .then(response => {
                    setColumns(response.data.columns);
                    setSelectedColumns([]); // Reset selected columns when role changes
                })
                .catch(error => {
                    console.error("Error fetching columns:", error);
                });
        }
    }, [role]);

    const handleColumnChange = (col) => {
        setSelectedColumns(prev =>
            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
        );
    };

    const handleExport = async () => {
        if (!role || selectedColumns.length === 0) {
            alert("Please select a role and at least one column to export.");
            return;
        }

        try {
            const response = await axios.post(
                "http://localhost:4000/api/export-bulk",
                { role, columns: selectedColumns },
                { responseType: "blob" }
            );

            // Create a link and trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `${role.toLowerCase()}_data.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error exporting data:", error);
        }
    };

    // Handle drag-and-drop reordering
    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const reorderedColumns = Array.from(selectedColumns);
        const [movedItem] = reorderedColumns.splice(result.source.index, 1);
        reorderedColumns.splice(result.destination.index, 0, movedItem);

        setSelectedColumns(reorderedColumns);
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.header}>Export Data</h2>

            {/* Role Selection */}
            <label style={styles.label}>Select Role: </label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.select}>
                <option value="">Select Role</option>
                <option value="Student">Student</option>
                <option value="Staff">Staff</option>
            </select>

            {/* Display Columns */}
            {columns.length > 0 && (
                <div style={styles.columnContainer}>
                    <h3 style={styles.subHeader}>Select Columns:</h3>
                    {columns.map((col) => (
                        <div key={col} style={styles.checkboxContainer}>
                            <input
                                type="checkbox"
                                value={col}
                                checked={selectedColumns.includes(col)}
                                onChange={() => handleColumnChange(col)}
                                style={styles.checkbox}
                            />
                            <label>{col}</label>
                        </div>
                    ))}
                </div>
            )}

            {/* Selected Columns with Drag-and-Drop */}
            {selectedColumns.length > 0 && (
                <div style={styles.reorderContainer}>
                    <h3 style={styles.subHeader}>Reorder Columns:</h3>
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="columns">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    style={styles.droppableArea}
                                >
                                    {selectedColumns.map((col, index) => (
                                        <Draggable key={col} draggableId={col} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={{
                                                        ...styles.draggableItem,
                                                        backgroundColor: snapshot.isDragging ? "#d1e7fd" : "#f8f9fa",
                                                        boxShadow: snapshot.isDragging ? "0 4px 6px rgba(0, 0, 0, 0.1)" : "none"
                                                    }}
                                                >
                                                    {col}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            )}

            {/* Export Button */}
            <button
                onClick={handleExport}
                disabled={!role || selectedColumns.length === 0}
                style={styles.button}
            >
                Export to Excel
            </button>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: "400px",
        margin: "20px auto",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "10px",
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
        backgroundColor: "#fff"
    },
    header: {
        textAlign: "center",
        color: "#333"
    },
    label: {
        fontWeight: "bold",
        display: "block",
        marginBottom: "5px"
    },
    select: {
        width: "100%",
        padding: "8px",
        borderRadius: "5px",
        border: "1px solid #ddd",
        marginBottom: "15px"
    },
    columnContainer: {
        marginBottom: "15px"
    },
    subHeader: {
        fontSize: "16px",
        fontWeight: "bold",
        marginBottom: "5px"
    },
    checkboxContainer: {
        display: "flex",
        alignItems: "center",
        marginBottom: "5px"
    },
    checkbox: {
        marginRight: "10px"
    },
    reorderContainer: {
        marginBottom: "15px"
    },
    droppableArea: {
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        minHeight: "100px",
        backgroundColor: "#fafafa"
    },
    draggableItem: {
        padding: "8px",
        margin: "5px 0",
        borderRadius: "5px",
        backgroundColor: "#f8f9fa",
        border: "1px solid #ccc",
        cursor: "grab",
        transition: "background-color 0.2s, box-shadow 0.2s"
    },
    button: {
        width: "100%",
        padding: "10px",
        backgroundColor: 'indigo',
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontSize: "16px",
        transition: "background-color 0.3s"
    }
};

export default Sheet;