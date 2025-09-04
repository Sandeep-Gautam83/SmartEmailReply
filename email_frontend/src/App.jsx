import { 
  Container, 
  TextField, 
  Typography, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  CircularProgress 
} from '@mui/material'
import { useState } from 'react'
import './App.css'
import axios from 'axios';

function App() {
  const [emailContent, setEmailContent] = useState('');
  const [tone, setTone] = useState('');
  const [generatedReply, setGeneratedReply] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8080/api/email/generate", {
        emailContent,
        tone
      });
      setGeneratedReply(
        typeof response.data === 'string' 
          ? response.data 
          : JSON.stringify(response.data, null, 2)
      );
    } catch (error) {
      console.error("Error generating email reply:", error);
      setGeneratedReply("⚠️ Failed to generate reply. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Email Reply Generator
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label="Original Email Content"
          value={emailContent}
          onChange={(e) => setEmailContent(e.target.value)}
          placeholder="Type your email here..."
        />

        <FormControl fullWidth>
          <InputLabel id="tone-label">Tone (Optional)</InputLabel>
          <Select
            labelId="tone-label"
            value={tone}           
            label="Tone (Optional)"
            onChange={(e) => setTone(e.target.value)}
          >
            <MenuItem value="none">None</MenuItem>
            <MenuItem value="professional">Professional</MenuItem>
            <MenuItem value="casual">Casual</MenuItem>
            <MenuItem value="friendly">Friendly</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={6}
          variant="outlined"
          value={generatedReply || ''}
          inputProps={{
            readOnly: true
          }}
          sx={{ mb: 2 }}
        />

        {/* Buttons row with equal width */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button 
            variant="contained"
            size="medium"
            onClick={handleSubmit}
            disabled={!emailContent || loading}
            sx={{ flex: 1 }}
          >
            {loading ? <CircularProgress size={24} /> : "Generate Reply"}
          </Button>

          <Button
            variant="outlined"
            size="medium"
            onClick={() => navigator.clipboard.writeText(generatedReply)}
            disabled={!generatedReply}
            sx={{ flex: 1 }}
          >
            Copy to Clipboard
          </Button>
        </Box>
      </Box>
    </Container>
  )
}

export default App
