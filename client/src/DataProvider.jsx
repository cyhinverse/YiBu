import React, { createContext, useState } from "react";

export const DataContext = createContext();

const DataProvider = ({ children }) => {
  const [hideSearch, setHideSearch] = useState(false);

  return (
    <DataContext.Provider value={{ hideSearch, setHideSearch }}>
      {children}
    </DataContext.Provider>
  );
};

export default DataProvider;
