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
      <Preview>Confirm your email address for Jemaw</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={logo}>jemaw<span style={{ color: "#f15b3a" }}>.</span></Heading>
          <Hr style={hr} />

          <Heading as="h2" style={h2}>Verify your email address</Heading>

          <Text style={text}>Hi {name},</Text>

          <Text style={text}>
            Confirm this email address to finish creating your account.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={url}>
              Confirm email
            </Button>
          </Section>

          <Text style={note}>
            This link expires in 24 hours. If you didn&apos;t create a Jemaw account,
            you can safely ignore this email.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Jemaw · Shared expenses, kept clear.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f4f4ef",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 28px",
  maxWidth: "560px",
  borderTop: "3px solid #f15b3a",
};

const logo = {
  color: "#1a1a1a",
  fontSize: "28px",
  fontWeight: "700",
  textAlign: "left" as const,
  margin: "0 0 20px",
};

const h2 = {
  color: "#171916",
  fontSize: "20px",
  fontWeight: "600",
  margin: "30px 0 16px",
};

const hr = {
  borderColor: "#d7d9d3",
  margin: "20px 0",
};

const text = {
  color: "#52574f",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const buttonContainer = {
  textAlign: "left" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#171916",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "13px 28px",
};

const note = {
  color: "#72776e",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "16px 0",
};

const footer = {
  color: "#72776e",
  fontSize: "12px",
  textAlign: "left" as const,
  margin: "0",
};

export default VerificationEmail;
