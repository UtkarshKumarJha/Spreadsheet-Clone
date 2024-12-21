import axios from "axios";
import React, { useState,useEffect, useRef } from "react";
import "./App.css";
import { IoMdArrowDropleft, IoMdArrowDropright } from "react-icons/io";
import { TbMathFunction } from "react-icons/tb";
import { create, all } from 'mathjs';

const math = create(all);

function App() {
  const inputCellContainerRef = useRef(null);
  const columnNameContainerRef = useRef(null);
  const rowNameContainerRef = useRef(null);

  const [data, setData] = useState([]);
  const [selectedCell, setSelectedCell] = useState({ row: null, col: null });
  const [formulaInput, setFormulaInput] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/data")
      .then((response) => setData(response.data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);
  const [isEditing, setIsEditing] = useState(false);

  const handleScroll = () => {
    const inputCellContainer = inputCellContainerRef.current;
    const columnNameContainer = columnNameContainerRef.current;
    const rowNameContainer = rowNameContainerRef.current;

    if (inputCellContainer && columnNameContainer && rowNameContainer) {
      columnNameContainer.scrollLeft = inputCellContainer.scrollLeft;
      rowNameContainer.scrollTop = inputCellContainer.scrollTop;
    }
  };

  const handleCellClick = (rowIndex, colIndex) => {
    setSelectedCell({ row: rowIndex, col: colIndex });
    setFormulaInput(data[rowIndex][colIndex]);
    setIsEditing(false);
  };

  const handleDoubleClick = (rowIndex, colIndex) => {
    setSelectedCell({ row: rowIndex, col: colIndex });
    setFormulaInput(data[rowIndex][colIndex]);
    setIsEditing(true);
  };

  const formulaInputRef = useRef(null);

  const handleInputChange = (e) => {
    const inputElement = formulaInputRef.current;

    const cursorPosition = inputElement.selectionStart;

    setFormulaInput(e.target.innerText);

    setTimeout(() => {
      inputElement.selectionStart = inputElement.selectionEnd = cursorPosition;
    }, 0);
  };


  const handleCellChange = (row, col, value) => {
  const updatedData = [...data];
  updatedData[row][col] = value;
  setData(updatedData);

  axios
    .post("http://localhost:5000/data", { row, col, value })
    .catch((error) => console.error("Error saving data:", error));
};


  const evaluateFormula = (formula) => {
    try {
      if (!formula.startsWith("=")) return formula;

      const cellRegex = /[A-Z]+\d+/g;
      const tokens = formula.slice(1).match(cellRegex) || [];
      let evaluatedFormula = formula.slice(1);

      tokens.forEach((cellRef) => {
        const [col, row] = parseCellReference(cellRef);
        const cellValue = data[row]?.[col] || 0;
        evaluatedFormula = evaluatedFormula.replace(cellRef, cellValue);
      });

      // Use Math.js to evaluate the final formula
      return math.evaluate(evaluatedFormula);
    } catch {
      return "ERROR";
    }
  };

  const parseCellReference = (cellRef) => {
    const colPart = cellRef.match(/[A-Z]+/)[0];
    const rowPart = parseInt(cellRef.match(/\d+/)[0], 10) - 1;

    let colIndex = 0;
    for (let i = 0; i < colPart.length; i++) {
      colIndex *= 26;
      colIndex += colPart.charCodeAt(i) - 65 + 1;
    }
    return [colIndex - 1, rowPart];
  };

  const generateColumnNames = () => {
    const columns = [];
    for (let i = 0; i < 20; i++) {
      let n = i;
      let name = "";
      while (n >= 0) {
        name = String.fromCharCode((n % 26) + 65) + name;
        n = Math.floor(n / 26) - 1;
      }
      columns.push(name);
    }
    return columns;
  };

  const rows = Array.from({ length: data.length }, (_, i) => i + 1);
  const columns = generateColumnNames();

  return (
    <div className="container">
      <div className="title-bar">Book 1 Excel</div>
      <div className="menu-bar">
        <div className="menu-item">File</div>
        <div className="menu-item">Home</div>
        <div className="menu-item">Insert</div>
        <div className="menu-item">Layout</div>
        <div className="menu-item">Help</div>
      </div>
      <div className="formula-bar">
        <div className="formula-editor selected-cell">
          {selectedCell.row !== null && selectedCell.col !== null ? `${columns[selectedCell.col]}${selectedCell.row + 1}` : ""}
        </div>
        <div className="function-sign">
          <TbMathFunction />
        </div>
        <div
          className="formula-editor formula-input"
          contentEditable
          onInput={(e) => {
            setFormulaInput(e.currentTarget.textContent); // Update the state with the input text
          }}
          onFocus={(e) => {
            if (selectedCell.row !== null && selectedCell.col !== null) {
              // Set the content of the formula bar when focused
              e.currentTarget.textContent = data[selectedCell.row][selectedCell.col] || "";
            }
          }}
          onBlur={() => {
            if (selectedCell.row !== null && selectedCell.col !== null) {
              const evaluatedValue = evaluateFormula(formulaInput);
              handleCellChange(selectedCell.row, selectedCell.col, evaluatedValue);
              setFormulaInput(""); // Clear formula input after applying it
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // Prevent new line in contentEditable
              if (selectedCell.row !== null && selectedCell.col !== null) {
                const evaluatedValue = evaluateFormula(formulaInput);
                handleCellChange(selectedCell.row, selectedCell.col, evaluatedValue);
                setFormulaInput(""); // Clear formula input after applying it
                e.currentTarget.blur(); // Remove focus after pressing Enter
              }
            }
          }}
        >
          {/* Display the formulaInput or the selected cell's value */}
          {selectedCell.row !== null && selectedCell.col !== null
            ? data[selectedCell.row][selectedCell.col]
            : ""}
        </div>

      </div>
      <div className="data-container">
        <div className="select-all"></div>
        <div className="column-name-container" ref={columnNameContainerRef}>
          {columns.map((colName, index) => (
            <div key={index} className="column-name">
              {colName}
            </div>
          ))}
        </div>
        <div className="row-name-container" ref={rowNameContainerRef}>
          {rows.map((row) => (
            <div key={row} className="row-name">
              {row}
            </div>
          ))}
        </div>
        <div
          className="input-cell-container"
          onScroll={handleScroll}
          ref={inputCellContainerRef}
        >
          {data.map((row, rowIndex) => (
            <div key={rowIndex} className="row">
              {row.map((cell, colIndex) => {
                const displayValue =
                  typeof cell === "string" && cell.startsWith("=")
                    ? evaluateFormula(cell)
                    : cell;
                return (
                  <div
                    key={`${colIndex}-${rowIndex}`}
                    className="cell"
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    onBlur={(e) =>
                      handleCellChange(rowIndex, colIndex, e.target.innerText)
                    }
                    onDoubleClick={() => handleDoubleClick(rowIndex, colIndex)}
                    style={{
                      backgroundColor:
                        selectedCell.row === rowIndex &&
                          selectedCell.col === colIndex
                          ? "#e0f7fa"
                          : "white",
                      border:
                        selectedCell.row === rowIndex &&
                          selectedCell.col === colIndex
                          ? "2px solid #00796b"
                          : "1px solid lightgray",
                    }}
                  >
                    {displayValue}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="sheet-bar">
        <div className="scroller">
          <div className="icon-left-scroll">
            <IoMdArrowDropleft />
          </div>
          <div className="icon-right-scroll">
            <IoMdArrowDropright />
          </div>
        </div>
        <div className="sheet-tab-container">
          <div className="sheet-tab">Sheet1</div>
        </div>
      </div>
    </div>
  );
}

export default App;