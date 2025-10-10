import { SearchBarProps } from "@/types/types";

export default function SearchBar({
  onSearchChange,
  searchTerm,
}: SearchBarProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit} className="search p-4 border-b">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={handleInputChange}
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </form>
  );
}
