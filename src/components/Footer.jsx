export default function Footer() {
  return (
    <footer style={styles.footer}>
      <p>صُنع بـ ❤️ · منصة <span style={styles.span}>المنارة</span> · جميع المعالجات تتم في المتصفح — بياناتك لا تُرسل لأي خادم</p>
    </footer>
  );
}

const styles = {
  footer: {
    textAlign: 'center',
    padding: '40px',
    borderTop: '1px solid var(--border)',
    color: 'var(--text-dim)',
    fontSize: '0.8rem',
    marginTop: 'auto'
  },
  span: {
    color: 'var(--c1)',
    fontWeight: 'bold'
  }
};
