import { useEffect, useState } from "react";
import { api } from "./api";
import type { HelloResponse } from "./api";
import heroImg from "@fe/assets/hero.png";
import reactLogo from "@fe/assets/react.svg";
import viteLogo from "@fe/assets/vite.svg";

const socialListClasses =
  "mt-8 flex list-none gap-2 p-0 max-[1024px]:mt-5 max-[1024px]:flex-wrap max-[1024px]:justify-center [&>li]:flex-none max-[1024px]:[&>li]:flex-[1_1_calc(50%_-_8px)] [&_a]:flex [&_a]:items-center [&_a]:gap-2 [&_a]:rounded-md [&_a]:bg-[var(--social-bg)] [&_a]:px-3 [&_a]:py-1.5 [&_a]:text-base [&_a]:leading-[inherit] [&_a]:text-[var(--text-h)] [&_a]:no-underline [&_a]:transition-shadow [&_a]:duration-300 [&_a]:ease-[ease] [&_a:hover]:shadow-[var(--shadow)] max-[1024px]:[&_a]:box-border max-[1024px]:[&_a]:w-full max-[1024px]:[&_a]:justify-center [&_.logo]:h-[18px] [&_.button-icon]:h-[18px] [&_.button-icon]:w-[18px]";

function App() {
  const [count, setCount] = useState(0);
  const [greeting, setGreeting] = useState<HelloResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadGreeting() {
      try {
        const response = await api.api.hello.$get({}, { init: { signal: controller.signal } });
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        const data = await response.json();
        if (!controller.signal.aborted) {
          setGreeting(data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("API の取得に失敗しました。");
        }
      }
    }

    void loadGreeting();
    return () => controller.abort();
  }, []);

  return (
    <>
      <section
        id="center"
        className="flex grow flex-col place-content-center place-items-center gap-[25px] max-[1024px]:gap-[18px] max-[1024px]:px-5 max-[1024px]:pt-8 max-[1024px]:pb-6"
      >
        <div className="relative">
          <img
            src={heroImg}
            className="relative z-0 mx-auto inline-block align-baseline w-[170px] [inset-inline:0]"
            width="170"
            height="179"
            alt=""
          />
          <img
            src={reactLogo}
            className="absolute z-[1] top-[34px] mx-auto inline-block align-baseline h-7 [inset-inline:0] transform-[perspective(2000px)_rotateZ(300deg)_rotateX(44deg)_rotateY(39deg)_scale(1.4)]"
            alt="React logo"
          />
          <img
            src={viteLogo}
            className="absolute z-0 top-[107px] mx-auto inline-block align-baseline h-[26px] w-auto [inset-inline:0] transform-[perspective(2000px)_rotateZ(300deg)_rotateX(40deg)_rotateY(39deg)_scale(0.8)]"
            alt="Vite logo"
          />
        </div>
        <div>
          <h1 className="my-8 text-[56px] leading-[inherit] tracking-[-1.68px] max-[1024px]:my-5 max-[1024px]:text-[36px]">
            Get started!!!!!
          </h1>
          {error ? (
            <p role="alert">{error}</p>
          ) : (
            <p role="status">{greeting ? greeting.message : "API を読み込み中…"}</p>
          )}
          <p>
            Edit <code>src/client/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="mb-6 inline-flex rounded-[5px] border-2 border-transparent bg-[var(--accent-bg)] px-[10px] py-[5px] [font-family:var(--mono)] text-base leading-[normal] tracking-normal text-[var(--accent)] transition-[border-color] duration-300 ease-[ease] hover:border-[var(--accent-border)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="relative w-full before:absolute before:top-[-4.5px] before:left-0 before:border-[5px] before:border-transparent before:border-l-[var(--border)] before:content-[''] after:absolute after:top-[-4.5px] after:right-0 after:border-[5px] after:border-transparent after:border-r-[var(--border)] after:content-['']"></div>

      <section
        id="next-steps"
        className="flex border-t border-[var(--border)] text-left max-[1024px]:flex-col max-[1024px]:text-center"
      >
        <div
          id="docs"
          className="flex-1 border-r border-[var(--border)] p-8 max-[1024px]:border-r-0 max-[1024px]:border-b max-[1024px]:px-5 max-[1024px]:py-6"
        >
          <svg
            className="mb-4 inline-block align-baseline h-[22px] w-[22px]"
            role="presentation"
            aria-hidden="true"
          >
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2 className="mb-2 text-2xl leading-[118%] tracking-[-0.24px] max-[1024px]:text-xl">
            Documentation
          </h2>
          <p>Your questions, answered</p>
          <ul className={socialListClasses}>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social" className="flex-1 p-8 max-[1024px]:px-5 max-[1024px]:py-6">
          <svg
            className="mb-4 inline-block align-baseline h-[22px] w-[22px]"
            role="presentation"
            aria-hidden="true"
          >
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2 className="mb-2 text-2xl leading-[118%] tracking-[-0.24px] max-[1024px]:text-xl">
            Connect with us
          </h2>
          <p>Join the Vite community</p>
          <ul className={socialListClasses}>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="relative w-full before:absolute before:top-[-4.5px] before:left-0 before:border-[5px] before:border-transparent before:border-l-[var(--border)] before:content-[''] after:absolute after:top-[-4.5px] after:right-0 after:border-[5px] after:border-transparent after:border-r-[var(--border)] after:content-['']"></div>
      <section
        id="spacer"
        className="box-content h-[88px] border-t border-[var(--border)] max-[1024px]:h-12"
      ></section>
    </>
  );
}

export default App;
