import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface VerificationEmailProps {
  name: string;
  url: string;
}

export function VerificationEmail({ name, url }: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your Jemaw account to get started</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={logo}>Jemaw</Heading>
          <Hr style={hr} />

          <Heading as="h2" style={h2}>Verify your email address</Heading>

          <Text style={text}>Hi {name},</Text>

          <Text style={text}>
            Thanks for signing up for Jemaw! Click the button below to verify your
            email address and activate your account.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={url}>
              Verify email →
            </Button>
          </Section>

          <Text style={note}>
            This link expires in 24 hours. If you didn&apos;t create a Jemaw account,
            you can safely ignore this email.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            © 2025 Jemaw · Expense sharing for groups
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const logo = {
  color: "#1a1a1a",
  fontSize: "28px",
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "0 0 20px",
};

const h2 = {
  color: "#333",
  fontSize: "20px",
  fontWeight: "600",
  margin: "30px 0 16px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#6366f1",
  borderRadius: "10px",
  color: "#fff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "13px 28px",
};

const note = {
  color: "#8898aa",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "16px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  textAlign: "center" as const,
  margin: "0",
};

export default VerificationEmail;
