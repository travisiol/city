"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { population, searchCities, type City } from "@/lib/cities";

/*
 * Finding your own city.
 *
 * A sphere with 999 dots on it is a lovely thing to look at and a hopeless
 * thing to search. Most people arriving here want exactly one city — theirs
 * — and dragging a spinning globe hunting for it is the fastest way to make
 * them leave. This is the shortcut, and picking a result flies the globe to
 * it rather than just selecting it, because selecting a city on the far
 * side would show them nothing at all.
 *
 * Results are keyboard-first: type, arrow, enter. The mouse works too, but
 * anyone who knows what they are looking for should never have to reach for
 * it.
 */
export function CitySearch({
  onPick,
  className,
}: {
  onPick: (city: City) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results = useMemo(() => searchCities(query), [query]);

  /*
   * Slash to search, the way every list-shaped page on the internet works.
   * Ignored while the caret is already in a field, or the shortcut eats the
   * character somebody was trying to type.
   */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A new query means the old highlight is meaningless, so the two move
  // together at every call site rather than through an effect chasing one
  // after the other.
  const type = (value: string) => {
    setQuery(value);
    setActive(0);
  };

  const pick = (city: City) => {
    onPick(city);
    type("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      type("");
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const city = results[active];
      if (city) pick(city);
    }
  };

  const showList = open && query.trim().length > 0;

  return (
    <div className={clsx("relative", className)}>
      <div className="flex items-center gap-2 border border-rule bg-void/90 px-3 py-2 backdrop-blur-sm focus-within:border-cold">
        <svg
          width="13"
          height="13"
          viewBox="0 0 13 13"
          aria-hidden
          focusable="false"
          className="shrink-0"
        >
          <circle
            cx="5.5"
            cy="5.5"
            r="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            className="text-cold"
          />
          <path
            d="M8.6 8.6 L12 12"
            stroke="currentColor"
            strokeWidth="1.4"
            className="text-cold"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => {
            type(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder="Find your city"
          aria-label="Search the 999 cities"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && results[active] ? `${listId}-${results[active].id}` : undefined
          }
          className="type-data w-full bg-transparent text-chalk placeholder:text-chalk-muted focus:outline-none"
        />
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching cities"
          /*
           * Blur fires before click, so without this the list is gone by
           * the time the mouse-up lands and nothing is ever picked.
           */
          onMouseDown={(event) => event.preventDefault()}
          className="absolute inset-x-0 top-full z-40 mt-1 max-h-[19rem] overflow-y-auto border border-rule bg-void/97 backdrop-blur-sm"
        >
          {results.length === 0 && (
            <li className="type-data px-3 py-2.5 text-chalk-muted">
              No city called that in the 999.
            </li>
          )}
          {results.map((city, i) => (
            <li key={city.id}>
              <button
                type="button"
                id={`${listId}-${city.id}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(city)}
                className={clsx(
                  "flex w-full items-baseline justify-between gap-3 border-b border-rule px-3 py-2 text-left last:border-b-0",
                  i === active ? "bg-field-raised" : "hover:bg-field-raised/60",
                )}
              >
                <span className="min-w-0">
                  <span className="type-data block truncate text-chalk">
                    {city.name}
                  </span>
                  <span className="type-data block truncate text-chalk-muted">
                    {city.country}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="type-data block text-cold">
                    {population(city.pop)}
                  </span>
                  <span className="type-label block text-chalk-muted">
                    #{String(city.id).padStart(3, "0")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
