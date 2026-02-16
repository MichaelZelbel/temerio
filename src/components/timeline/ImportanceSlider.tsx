import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const impactLabels: Record<number, string> = {
  1: "Minor",
  2: "Noticeable",
  3: "Strong Impact",
  4: "Life-Shaping",
};

interface ImportanceSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const ImportanceSlider = ({ value, onChange }: ImportanceSliderProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label>Impact: {value} — {impactLabels[value]}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 text-sm space-y-3" side="top">
            <p className="text-muted-foreground text-xs">
              Impact measures structural life change, not emotion.
            </p>
            <ul className="space-y-0.5 text-xs">
              {Object.entries(impactLabels).map(([n, label]) => (
                <li key={n} className="flex gap-1.5">
                  <span className="font-medium text-foreground w-4 shrink-0 text-right">{n}</span>
                  <span className="text-muted-foreground">— {label}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => navigate("/docs?page=importance")}
            >
              View full guide →
            </Button>
          </PopoverContent>
        </Popover>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={1} max={4} step={1} />
    </div>
  );
};

export default ImportanceSlider;
