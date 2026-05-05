import { useState, useCallback, useEffect } from 'react';

export const useSearchManagement = (showToast, activeFilePath, setEditorCode, setIsDirty) => {
  const [leftSearchQuery, setLeftSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [searchOptions, setSearchOptions] = useState({
    matchCase: false,
    wholeWord: false,
    useRegex: false
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      if (window.codeforge?.searchInFiles) {
        const results = await window.codeforge.searchInFiles(query, searchOptions);
        setSearchResults(results || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      showToast('Search failed', 'error');
    } finally {
      setIsSearching(false);
    }
  }, [searchOptions, showToast]);

  const handleReplace = useCallback(async (filePath, lineNumber, oldText, newQuery) => {
    try {
      if (!window.codeforge?.readFile || !window.codeforge?.writeFile) return;
      const content = await window.codeforge.readFile(filePath);
      const lines = content.split('\n');
      
      const lineIndex = lineNumber - 1;
      let lineText = lines[lineIndex];
      
      let flags = 'g';
      if (!searchOptions.matchCase) flags += 'i';
      let searchPattern = leftSearchQuery;
      if (!searchOptions.useRegex) searchPattern = leftSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (searchOptions.wholeWord) searchPattern = `\\b${searchPattern}\\b`;
      
      const regex = new RegExp(searchPattern, flags);
      lines[lineIndex] = lineText.replace(regex, newQuery);
      
      const newContent = lines.join('\n');
      await window.codeforge.writeFile(filePath, newContent);
      
      performSearch(leftSearchQuery);
      
      if (activeFilePath === filePath) {
        setEditorCode(newContent);
        setIsDirty(false);
      }
      
      window.dispatchEvent(new CustomEvent('cf:editor-scroll-to-line', { detail: { filePath, lineNumber } }));
      showToast('Replaced match');
    } catch (error) {
      showToast('Replace failed', 'error');
    }
  }, [activeFilePath, leftSearchQuery, searchOptions, performSearch, showToast, setEditorCode, setIsDirty]);

  const handleReplaceAll = useCallback(async () => {
    if (!leftSearchQuery) return;
    setIsSearching(true);
    try {
      for (const result of searchResults) {
        const { path } = result;
        const content = await window.codeforge.readFile(path);
        
        let flags = 'g';
        if (!searchOptions.matchCase) flags += 'i';
        let searchPattern = leftSearchQuery;
        if (!searchOptions.useRegex) searchPattern = leftSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (searchOptions.wholeWord) searchPattern = `\\b${searchPattern}\\b`;
        
        const regex = new RegExp(searchPattern, flags);
        const newContent = content.replace(regex, replaceQuery);
        
        await window.codeforge.writeFile(path, newContent);
        
        if (activeFilePath === path) {
          setEditorCode(newContent);
          setIsDirty(false);
        }
      }
      performSearch(leftSearchQuery);
      showToast(`Replaced all occurrences of "${leftSearchQuery}"`);
    } catch (error) {
      showToast('Replace all failed', 'error');
    } finally {
      setIsSearching(false);
    }
  }, [activeFilePath, leftSearchQuery, replaceQuery, searchOptions, searchResults, performSearch, showToast, setEditorCode, setIsDirty]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (leftSearchQuery) performSearch(leftSearchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [leftSearchQuery, searchOptions, performSearch]);

  return {
    leftSearchQuery,
    setLeftSearchQuery,
    replaceQuery,
    setReplaceQuery,
    isReplaceOpen,
    setIsReplaceOpen,
    searchOptions,
    setSearchOptions,
    isSearching,
    searchResults,
    setSearchResults,
    performSearch,
    handleReplace,
    handleReplaceAll
  };
};
