function BuggyComponent() {
  throw new Error("Test ErrorBoundary");
  return <div>OK</div>;
}

export default BuggyComponent;
