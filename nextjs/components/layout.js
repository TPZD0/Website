import NavigationLayout from "./NavigationBar";

export default function Layout({ children }) {
    return (
      <>
        <div />
            <NavigationLayout/>
            <main>{children}</main>
        <div />
      </>
    )
  }

  