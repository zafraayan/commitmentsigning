import { useEffect, useRef, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import DrawOutlinedIcon from "@mui/icons-material/DrawOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import "./App.css";
import { isSupabaseConfigured, supabase } from "./supabase.js";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#006b61", dark: "#004d46", contrastText: "#ffffff" },
    background: { default: "#ffffff", paper: "#ffffff" },
    text: { primary: "#111111", secondary: "#3f4947" },
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
    button: { textTransform: "none", fontWeight: 650 },
  },
});

const previousDefaultCommitments = [
  "I commit to using the eLGU system responsibly, securely, and only for legitimate government purposes. I will provide accurate information, protect confidential data, follow applicable laws and procedures, report concerns through proper channels, and uphold integrity, accountability, professionalism, and respect to support efficient public service and strengthen community trust.",
  "I commit to acting with integrity, taking responsibility for my choices, and following through on the promises I make.",
  "I commit to providing complete and accurate information, using the eLGU system responsibly, and complying with all applicable local government policies, procedures, and legal requirements.",
  "I commit to supporting the effective, secure, and responsible use of the eLGU system. I will provide complete and accurate information, protect confidential data, follow authorized procedures, and use digital services only for legitimate government purposes. I will help improve public service delivery by acting with integrity, accountability, professionalism, and respect for every citizen. I will report errors, security concerns, misuse, or service issues through the proper channels. I will cooperate with local government personnel, observe applicable laws and policies, and contribute to a reliable, transparent, accessible, and efficient eLGU system that benefits our community and strengthens lasting public trust.",
  "I commit to supporting the effective, secure, and responsible use of the eLGU system. I will provide complete and accurate information, protect confidential data, follow authorized procedures, and use digital services only for legitimate government purposes. I will help improve public service delivery by acting with integrity, accountability, professionalism, and respect for every citizen. I will report errors, security concerns, misuse, or service issues through the proper channels. I will cooperate with local government personnel, observe applicable laws and policies, and contribute to a reliable, transparent, accessible, and efficient eLGU system that benefits our community and strengthens lasting public trust. I will also support continuous improvement by sharing constructive feedback, participating in authorized training, and helping colleagues understand appropriate system practices. I recognize that dependable digital government requires careful recordkeeping, timely updates, secure access, and respectful communication across offices. I will avoid unauthorized changes, protect passwords and devices, verify information before submission, and preserve official records according to established retention rules. When assisting residents, I will promote equal access, clear guidance, prompt service, and fair treatment. Through these actions, I will help eLGU deliver responsive local governance, reduce delays, strengthen coordination, protect public resources, and create better outcomes for everyone.",
];

const initialCommitment =
  "Today, I reaffirm my commitment to building a smarter, faster, and more transparent City Government of Talisay. Through digital transformation, I pledge to embrace innovation, improve public services, and promote accountability. I will ensure that technology serves every Talisaynon, creating a more efficient, accessible, and future-ready government for all.";

const sessionStorageKey = "pledgeform-session";
const commitmentKey = "talisay-elgu-2026";

const readSession = () => {
  try {
    const storedSession = JSON.parse(localStorage.getItem(sessionStorageKey));
    if (!storedSession) return null;
    return {
      commitment:
        !storedSession.commitment ||
        previousDefaultCommitments.includes(storedSession.commitment)
          ? initialCommitment
          : storedSession.commitment,
      createdAt: storedSession.createdAt
        ? new Date(storedSession.createdAt)
        : new Date(),
      signatures: (storedSession.signatures || []).map((signature) => ({
        ...signature,
        signedAt: new Date(signature.signedAt),
      })),
    };
  } catch {
    return null;
  }
};

const saveSession = (commitment, signatures, createdAt) => {
  localStorage.setItem(
    sessionStorageKey,
    JSON.stringify({ commitment, signatures, createdAt }),
  );
};

function SignaturePad({ onChange, initialImage }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const initialImageRef = useRef(initialImage);
  const [hasSignature, setHasSignature] = useState(Boolean(initialImage));

  useEffect(() => {
    const context = canvasRef.current.getContext("2d");
    context.lineWidth = 3;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#173e3a";
    if (initialImageRef.current) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0);
      image.src = initialImageRef.current;
      return () => {
        image.onload = null;
      };
    }
    // Restore the draft only when the pad mounts after route navigation.
  }, []);

  const getPosition = (event) => {
    const canvas = canvasRef.current;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
    };
  };

  const startDrawing = (event) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const { x, y } = getPosition(event);
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + 0.1, y + 0.1);
    context.stroke();
    drawingRef.current = true;
    setHasSignature(true);
    onChange(true, canvas.toDataURL("image/png"));
  };

  const draw = (event) => {
    if (!drawingRef.current) return;
    const { x, y } = getPosition(event);
    const context = canvasRef.current.getContext("2d");
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    drawingRef.current = false;
    if (hasSignature) {
      onChange(true, canvasRef.current.toDataURL("image/png"));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange(false, "");
  };

  return (
    <Box>
      <Box className="signature-canvas-wrap">
        <canvas
          ref={canvasRef}
          aria-label="Signature area. Draw your signature with a mouse, touch, or stylus."
          className="signature-canvas"
          height="220"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          width="1200"
        />
        {!hasSignature && (
          <Typography className="signature-placeholder" variant="body2">
            Sign here using your mouse, touchscreen, or stylus
          </Typography>
        )}
      </Box>
      <Stack
        sx={{
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "flex-end",
          mt: 1.25,
        }}
      >
        <Button
          color="inherit"
          onClick={clear}
          size="small"
          startIcon={<RestartAltIcon />}
        >
          Clear
        </Button>
      </Stack>
    </Box>
  );
}

function App() {
  const navigate = useNavigate();
  const [initialSession] = useState(readSession);
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [commitment, setCommitment] = useState(
    initialSession?.commitment || initialCommitment,
  );
  const [signatureDrawn, setSignatureDrawn] = useState(false);
  const [signatureImage, setSignatureImage] = useState("");
  const [signaturePadKey, setSignaturePadKey] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [signatures, setSignatures] = useState(
    initialSession?.signatures || [],
  );
  const [today, setToday] = useState(
    () => initialSession?.createdAt || new Date(),
  );
  const [databaseError, setDatabaseError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [removingSignatureId, setRemovingSignatureId] = useState(null);

  useEffect(() => {
    if (!supabase) return undefined;

    let isActive = true;

    const loadSignatures = async () => {
      const { data, error } = await supabase
        .from("signatures")
        .select("id, commitment, signer_name, signature_image, signed_at")
        .eq("commitment_key", commitmentKey)
        .order("signed_at", { ascending: true });

      if (!isActive) return;
      if (error) {
        setDatabaseError(`Unable to load signatures: ${error.message}`);
        return;
      }

      const sharedSignatures = data.map((signature) => ({
        id: signature.id,
        name: signature.signer_name,
        image: signature.signature_image,
        signedAt: new Date(signature.signed_at),
      }));
      setSignatures(sharedSignatures);
      if (data.length > 0) {
        setToday(new Date(data[0].signed_at));
      }
      setDatabaseError("");
    };

    loadSignatures();

    const channel = supabase
      .channel("shared-signatures")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "signatures",
          filter: `commitment_key=eq.${commitmentKey}`,
        },
        ({ new: signature }) => {
          setSignatures((current) => {
            if (current.some((item) => item.id === signature.id))
              return current;
            return [
              ...current,
              {
                id: signature.id,
                name: signature.signer_name,
                image: signature.signature_image,
                signedAt: new Date(signature.signed_at),
              },
            ];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "signatures",
        },
        ({ old: signature }) => {
          setSignatures((current) =>
            current.filter((item) => item.id !== signature.id),
          );
        },
      )
      .subscribe();

    return () => {
      isActive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const syncPreview = (event) => {
      if (event.key !== sessionStorageKey) return;
      const session = readSession();
      if (!session) return;
      setCommitment(session.commitment);
      setSignatures(session.signatures);
      setToday(session.createdAt);
    };

    window.addEventListener("storage", syncPreview);
    return () => window.removeEventListener("storage", syncPreview);
  }, []);

  const canAddSignature =
    name.trim().length > 0 &&
    commitment.trim().length > 0 &&
    signatureDrawn &&
    signatureImage.length > 0 &&
    accepted;

  const signerNameError = nameTouched && name.trim().length === 0;

  const addSignature = async () => {
    if (!canAddSignature || isSaving) return;

    setIsSaving(true);
    setDatabaseError("");

    let addedSignature;

    if (supabase) {
      const { data, error } = await supabase
        .from("signatures")
        .insert({
          commitment_key: commitmentKey,
          commitment,
          signer_name: name.trim(),
          signature_image: signatureImage,
        })
        .select("id, signer_name, signature_image, signed_at")
        .single();

      if (error) {
        setDatabaseError(`Unable to save signature: ${error.message}`);
        setIsSaving(false);
        return;
      }

      addedSignature = {
        id: data.id,
        name: data.signer_name,
        image: data.signature_image,
        signedAt: new Date(data.signed_at),
      };
    } else {
      addedSignature = {
        id: `${Date.now()}-local`,
        name: name.trim(),
        image: signatureImage,
        signedAt: new Date(),
      };
    }

    setSignatures((current) => {
      if (current.some((signature) => signature.id === addedSignature.id)) {
        return current;
      }
      const updatedSignatures = [...current, addedSignature];
      saveSession(commitment, updatedSignatures, today);
      return updatedSignatures;
    });
    setName("");
    setNameTouched(false);
    setSignatureDrawn(false);
    setSignatureImage("");
    setSignaturePadKey((key) => key + 1);
    setAccepted(false);
    setIsSaving(false);
    navigate("/success", { replace: true });
    window.scrollTo(0, 0);
  };

  const updateCommitment = (value) => {
    setCommitment(value);
    saveSession(value, signatures, today);
  };

  const removeSignature = async (signatureToRemove) => {
    const shouldRemove = window.confirm(
      `Remove the signature of ${signatureToRemove.name}? This cannot be undone.`,
    );
    if (!shouldRemove) return;

    setRemovingSignatureId(signatureToRemove.id);
    setDatabaseError("");

    if (supabase) {
      const { error } = await supabase
        .from("signatures")
        .delete()
        .eq("id", signatureToRemove.id)
        .eq("commitment_key", commitmentKey);

      if (error) {
        setDatabaseError(`Unable to remove signature: ${error.message}`);
        setRemovingSignatureId(null);
        return;
      }
    }

    setSignatures((current) => {
      const updatedSignatures = current.filter(
        (signature) => signature.id !== signatureToRemove.id,
      );
      saveSession(commitment, updatedSignatures, today);
      return updatedSignatures;
    });
    setRemovingSignatureId(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar className="topbar" elevation={0} position="static">
        <Toolbar className="topbar-content">
          <Box className="brand-mark">
            <img alt="City of Talisay seal" src="/logos/talisay.png" />
          </Box>
          <Typography className="brand-name" component="span">
            City Government of Talisay, Cebu
          </Typography>
        </Toolbar>
      </AppBar>

      <Container className="page-container" maxWidth="lg">
        <Routes>
          <Route
            path="/success"
            element={
              <Paper className="form-card" elevation={0} sx={{ textAlign: "center", py: 6 }}>
                <CheckCircleOutlineIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
                <Typography component="h1" variant="h4" gutterBottom>
                  Commitment submitted successfully
                </Typography>
                <Typography color="text.secondary">
                  Thank you for signing your commitment to the City Government of Talisay.
                  Your signature has been saved.
                </Typography>
                <Button component={Link} to="/" variant="contained" sx={{ mt: 3 }}>
                  Add another signature
                </Button>
              </Paper>
            }
          />
          <Route
            path="/preview"
            element={
              <Paper className="preview-page" elevation={0}>
                <Box className="preview-commitment">
                  <Typography className="preview-label" variant="overline">
                    COMMITMENT STATEMENT
                  </Typography>
                  <Typography className="preview-statement">
                    {commitment}
                  </Typography>
                  <Stack
                    sx={{
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      mt: 2,
                    }}
                  >
                    <Typography color="text.secondary" variant="caption">
                      Created {today.toLocaleDateString()}
                    </Typography>
                    <Chip
                      icon={<CheckCircleOutlineIcon />}
                      label={`${signatures.length} ${
                        signatures.length === 1 ? "signature" : "signatures"
                      }`}
                      size="small"
                    />
                  </Stack>
                </Box>

                <Divider />

                <Box className="signature-list">
                  {databaseError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {databaseError}
                    </Alert>
                  )}
                  <Box className="signature-grid">
                    {signatures.map((signature, index) => (
                      <Card
                        className="signed-person-card"
                        elevation={0}
                        key={signature.id}
                      >
                        <CardContent>
                          <Box className="signature-entry">
                            <Box className="signature-number">{index + 1}</Box>
                            <Box className="signature-block">
                              <Box className="signature-image">
                                <img
                                  alt={`Signature of ${signature.name}`}
                                  src={signature.image}
                                />
                              </Box>
                              <Typography className="signed-person-name">
                                {signature.name}
                              </Typography>
                              <Typography
                                className="signed-person-date"
                                color="text.secondary"
                                variant="caption"
                              >
                                Signed {signature.signedAt.toLocaleString()}
                              </Typography>
                            </Box>
                            <IconButton
                              aria-label={`Remove signature of ${signature.name}`}
                              className="remove-signature-button"
                              color="error"
                              disabled={removingSignatureId === signature.id}
                              onClick={() => removeSignature(signature)}
                              size="small"
                              title="Remove signature"
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Box>

                <Stack
                  className="preview-actions"
                  spacing={1.5}
                  sx={{
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "flex-end",
                  }}
                >
                  <Button onClick={() => window.print()} variant="contained">
                    Print commitment
                  </Button>
                </Stack>
              </Paper>
            }
          />
          <Route
            path="/"
            element={
              <Box className="content-grid">
                <Paper className="form-card" elevation={0}>
                  <Box className="elgu-header">
                    <img
                      alt="City of Talisay eLGU System Launching"
                      src="/images/elgu-talisay-header-1774.jpg"
                      srcSet="/images/elgu-talisay-header-800.jpg 800w, /images/elgu-talisay-header-1774.jpg 1774w"
                      sizes="(max-width: 560px) calc(100vw - 70px), calc(100vw - 108px)"
                      width="1774"
                      height="887"
                      loading="eager"
                      fetchPriority="high"
                    />
                  </Box>

                  <Box className="form-section commitment-section">
                    <Typography className="field-label" component="h3">
                      1. Commitment statement
                    </Typography>
                    <TextField
                      className="commitment-field"
                      disabled={signatures.length > 0}
                      fullWidth
                      minRows={3}
                      multiline
                      onChange={(event) => updateCommitment(event.target.value)}
                      value={commitment}
                      variant="outlined"
                    />
                    {signatures.length === 0 && (
                      <Typography
                        className="helper-text"
                        color="text.secondary"
                      >
                        You can edit this statement before the first person
                        signs.
                      </Typography>
                    )}
                  </Box>

                  <Box className="form-section">
                    <Typography className="field-label" component="h3">
                      2. Signer name
                    </Typography>
                    <TextField
                      autoComplete="name"
                      error={signerNameError}
                      fullWidth
                      helperText={
                        signerNameError
                          ? "Signer name is required."
                          : `${name.length}/150 characters`
                      }
                      inputProps={{ maxLength: 150 }}
                      onChange={(event) => setName(event.target.value)}
                      onBlur={() => setNameTouched(true)}
                      placeholder="Enter the signer's full name"
                      required
                      value={name}
                      variant="outlined"
                    />
                  </Box>

                  <Box className="form-section">
                    <Stack
                      sx={{
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        mb: 1.25,
                      }}
                    >
                      <Typography className="field-label" component="h3">
                        3. Add signature
                      </Typography>
                      <Chip
                        className="device-chip"
                        icon={<DrawOutlinedIcon />}
                        label="Touch / stylus capture"
                        size="small"
                      />
                    </Stack>
                    <SignaturePad
                      key={signaturePadKey}
                      initialImage={signatureImage}
                      onChange={(drawn, image) => {
                        setSignatureDrawn(drawn);
                        setSignatureImage(image);
                      }}
                    />
                  </Box>

                  <Box className="acknowledgment">
                    <input
                      checked={accepted}
                      id="acknowledge"
                      onChange={(event) => setAccepted(event.target.checked)}
                      type="checkbox"
                    />
                    <label htmlFor="acknowledge">
                      I have read this commitment and understand that my
                      signature represents my agreement.
                    </label>
                  </Box>

                  <Button
                    className="complete-button"
                    disabled={!canAddSignature || isSaving}
                    fullWidth
                    onClick={addSignature}
                    size="large"
                    variant="contained"
                  >
                    {isSaving ? "Saving signature…" : "Add signature"}
                  </Button>
                  {databaseError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {databaseError}
                    </Alert>
                  )}
                  {!isSupabaseConfigured && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      Shared storage is not configured. Signatures are being
                      saved only in this browser.
                    </Alert>
                  )}
                  {!canAddSignature && (
                    <Typography
                      align="center"
                      className="button-hint"
                      color="text.secondary"
                      variant="caption"
                    >
                      Enter the signer&apos;s name, draw a signature, and
                      confirm agreement.
                    </Typography>
                  )}
                </Paper>
              </Box>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Box className="page-footer">
          <Typography color="text.secondary" variant="caption">
            A simple, private way to make your commitment.
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
