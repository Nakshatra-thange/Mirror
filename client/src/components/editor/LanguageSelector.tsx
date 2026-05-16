import { LANGUAGES} from "../../constants/languages";
import type {LanguageValue } from "../../constants/languages";

interface Props {
  value: LanguageValue;
  onChange: (lang: LanguageValue) => void;
  disabled?: boolean;
}

export default function LanguageSelector({ value, onChange, disabled }: Props) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value as LanguageValue)}
      className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 rounded px-2 py-1 
                 focus:outline-none focus:border-violet-500 disabled:opacity-40 cursor-pointer"
    >
      {LANGUAGES.map(l => (
        <option key={l.value} value={l.value}>{l.label}</option>
      ))}
    </select>
  );
}