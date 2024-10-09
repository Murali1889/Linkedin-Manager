'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Button } from './components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip";
import { Edit2, Save, X, Briefcase, MapPin, Link as LinkIcon, Star, Building } from 'lucide-react';

const API_URL = 'https://script.google.com/macros/s/AKfycbzp9HqpBboKbuHatr8KMF9tB4XORcstGmRTgnrYrZ0pXRJpizZ7M5l2f9U1ckUowYw6fQ/exec'; // Replace with your actual API URL

export default function Data() {
  const [profiles, setProfiles] = useState([]);
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);

  // Fetch profiles from the API
  useEffect(() => {
    async function fetchProfiles() {
      try {
        const response = await axios.post(API_URL, {
          spreadsheetId: '1B8D6mk85xPPS8D_cpSyBJJi4o5tyanHoUUiE9WiGc5M',
          tabName: '1.2 - Profiles' // Replace with actual spreadsheet ID and tab name
        });
        console.log(response)
        console.log(response.data)
        setProfiles(response.data.data);
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
      }
    }
    fetchProfiles();
  }, []);

  const filteredProfiles = profiles?.filter(profile =>
    filter === 'all' || profile.role_relevance === filter || (filter === 'not_evaluated' && !profile.role_relevance)
  );

  const handleEdit = (id) => setEditingId(id);
  const handleSave = (id) => setEditingId(null);
  const handleCancel = () => setEditingId(null);

  const handleChange = (id, field, value) => {
    setProfiles(profiles.map(profile =>
      profile.id === id ? { ...profile, [field]: value } : profile
    ));
  };

  const getScoreColor = (score) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRelevanceColor = (relevance) => {
    if (!relevance) return 'bg-gray-600';
    switch (relevance) {
      case 'Yes': return 'bg-green-500';
      case 'Maybe': return 'bg-yellow-500';
      case 'No': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCardStyle = (relevance) => {
    return relevance ? 'bg-white' : 'bg-gray-800 text-white';
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen font-sans">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Job Candidates Dashboard</h1>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Select onValueChange={setFilter} defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Relevance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Profiles</SelectItem>
              <SelectItem value="Yes">Relevant</SelectItem>
              <SelectItem value="Maybe">Maybe Relevant</SelectItem>
              <SelectItem value="No">Not Relevant</SelectItem>
              <SelectItem value="not_evaluated">Not Evaluated Yet</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-lg">
            {filteredProfiles?.length} Profiles
          </Badge>
        </div>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {filteredProfiles?.map((profile) => (
            <motion.div
              key={profile.id}
              layout
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`overflow-hidden hover:shadow-lg transition-shadow duration-300 ${getCardStyle(profile.role_relevance)}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <Avatar>
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${profile.id}`} />
                        <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className={`text-xl font-semibold ${!profile.role_relevance ? 'text-white' : 'text-gray-800'}`}>{profile.name}</h2>
                        <p className={`text-sm ${!profile.role_relevance ? 'text-gray-300' : 'text-gray-500'}`}>{profile.title}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {editingId === profile.id ? (
                        <>
                          <Button size="sm" onClick={() => handleSave(profile.id)}><Save className="h-4 w-4" /></Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}><X className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEdit(profile.id)}><Edit2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Briefcase className={`h-4 w-4 ${!profile.role_relevance ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${!profile.role_relevance ? 'text-gray-300' : 'text-gray-800'}`}>{profile.current_company}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building className={`h-4 w-4 ${!profile.role_relevance ? 'text-gray-400' : 'text-gray-500'}`} />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className={`text-sm truncate max-w-[200px] ${!profile.role_relevance ? 'text-gray-300' : 'text-gray-800'}`}>{profile.previous_companies}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{profile.previous_companies}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className={`h-4 w-4 ${!profile.role_relevance ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${!profile.role_relevance ? 'text-gray-300' : 'text-gray-800'}`}>{profile.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className={`h-4 w-4 ${!profile.role_relevance ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${!profile.role_relevance ? 'text-gray-300' : 'text-gray-800'}`}>{Math.floor(profile.experience / 12)} years experience</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <LinkIcon className={`h-4 w-4 ${!profile.role_relevance ? 'text-gray-400' : 'text-gray-500'}`} />
                        <a href={profile.URL} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline">{profile.URL ? 'LinkedIn Profile' : 'No Profile'}</a>
                      </div>
                    </TabsContent>
                    <TabsContent value="evaluation" className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Role Relevance:</span>
                        {editingId === profile.id ? (
                          <Select
                            value={profile.role_relevance}
                            onValueChange={(value) => handleChange(profile.id, 'role_relevance', value)}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="Maybe">Maybe</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={`${getRelevanceColor(profile.role_relevance)} text-white`}>
                            {profile.role_relevance || 'Not Evaluated Yet'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Score:</span>
                        <span className={`font-bold text-lg ${getScoreColor(profile.score)}`}>
                          {profile.score ? `${profile.score}/5` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">Reason:</span>
                        <p className="text-sm text-gray-600 mt-1">{profile.reason || 'No reason provided'}</p>
                      </div>
                      {profile.source && (
                        <div>
                          <span className="font-semibold">Source:</span>
                          <p className="text-sm text-gray-600 mt-1">{profile.source}</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}