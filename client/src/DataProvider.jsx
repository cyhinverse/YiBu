import React, { createContext, useState } from "react";

export const DataContext = createContext();

const DataProvider = ({ children }) => {
  const [hideSearch, setHideSearch] = useState(false);
  const [showHideMusic,setShowHideMusic] = useState(false)

  return (
    <DataContext.Provider value={{ hideSearch, setHideSearch,showHideMusic,setShowHideMusic }}>
      {children}
    </DataContext.Provider>
  );
};

export default DataProvider;
