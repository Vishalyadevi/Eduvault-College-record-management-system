import React from "react";

export default function App() {
  return (
    <>
      <div
        className="scrolling-images"
        style={{
          boxSizing: "border-box",
          animation: "10s linear 0s infinite normal none running scrollImages",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <noscript style={{ boxSizing: "border-box" }}>
          {
            '<img decoding="async" class="image" src="https://nec.edu.in/wp-content/uploads/2025/04/Company-Logos-for-Website-copy-11.png" alt="Scrolling Image 1">'
          }
        </noscript>
        <img
          className="image lazyloaded"
          alt="Scrolling Image 1"
          src="https://nec.edu.in/wp-content/uploads/2025/04/Company-Logos-for-Website-copy-11.png"
          style={{
            verticalAlign: "middle",
            boxSizing: "border-box",
            width: "100%",
            border: "none",
            borderRadius: "0px",
            boxShadow: "none",
            height: "auto",
            maxWidth: "100%",
          }}
        />
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
html {
  border: 0px;
  margin: 0px;
  outline: 0px;
  padding: 0px;
  font-style: inherit;
  font-weight: inherit;
  vertical-align: baseline;
  text-size-adjust: 100%;
  box-sizing: border-box;
  scroll-behavior: smooth;
  font-size: 100%;
}

body {
  box-sizing: inherit;
  border: 0px;
  outline: 0px;
  vertical-align: baseline;
  background: rgb(255, 255, 255);
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  padding: 0px;
  overflow-x: hidden;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  font-size: 1rem;
  line-height: var(--ast-body-line-height,1.6em);
  color: #76767f;
  background-color: #f6f7fd;
  background-image: none;
  margin: 0px;
  position: relative;
}
`,
        }}
      />
    </>
  );
}
